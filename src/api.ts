import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { CHOICES_PNPKEY_SOURCES, MEMORY_NAME_REFRESH_CYCLES, MIN_POLL_RATE_MS, hex2 } from './constants.js'
import { MEMORY_COUNT, MEMORY_NAME_LENGTH } from './state.js'
import { updateVariableValues } from './variables.js'

export const DEFAULT_PORT = 8023

/**
 * WIRE FORMAT — preserved from the original module, do not change without
 * hardware verification:
 *   - set:     'DTH:<address>,<value>;\n\n'   (the doubled newline is intentional;
 *              the original code appended '\n' twice and the device accepts it)
 *   - request: 'RQH:<address>,000001;\n'
 *   - version: 'VER\n'
 *   - tally:   'DTH:0C0100,01;\n' subscribes to bulk tally pushes
 * Values are sent verbatim: hex strings stay hex strings, and the 14-bit
 * MSB/LSB pairs from calculateBytes() are sent as decimal numbers.
 */

/** Past this with no complete frame it is not a frame at all — see processIncomingData. */
const RX_BUFFER_LIMIT = 8192

const WATCHDOG_TICK_MS = 1000
const NUDGE_AFTER_MS = 1500
const RECONNECT_AFTER_MS = 4000
const AUTH_STALL_MS = 6000
const UNREACHABLE_RECYCLE_MS = 12000
const FEEDBACK_DEBOUNCE_MS = 40

/**
 * The watchdog's "are you still there" poke. Deliberately an address that is
 * already in the regular poll set (last memory loaded) so the watchdog can
 * never put an unfamiliar command on the wire.
 */
const WATCHDOG_NUDGE = 'RQH:0A0003,000001;'

/** Connection-layer runtime state. Lives on the instance so teardown can reach it. */
export interface ConnectionRuntime {
	/** Accumulated, not-yet-framed bytes from the socket. */
	rxBuffer: string
	isAuthenticated: boolean
	/** The password has been sent once; a second prompt means it was rejected. */
	authSent: boolean
	/** Login was refused or locked out — do not reconnect into it automatically. */
	authFailed: boolean
	lastRxTime: number
	/** When this connection attempt started, for the unreachable-host tier. */
	cycleStartTime: number
	watchdogTimer: NodeJS.Timeout | undefined
	debounceTimer: NodeJS.Timeout | undefined
	/** Completed poll cycles, used to pace the memory-name refresh. */
	pollCycle: number
}

export function createConnectionRuntime(): ConnectionRuntime {
	return {
		rxBuffer: '',
		isAuthenticated: false,
		authSent: false,
		authFailed: false,
		lastRxTime: 0,
		cycleStartTime: 0,
		watchdogTimer: undefined,
		debounceTimer: undefined,
		pollCycle: 0,
	}
}

/**
 * The passcode to answer the prompt with. Prefers the secrets store, falling back
 * to the legacy plaintext config value so a connection whose upgrade script has
 * not run yet still authenticates.
 */
function getPassword(self: ModuleInstance): string {
	return self.secrets?.password || self.config.password || ''
}

export function initConnection(self: ModuleInstance): void {
	teardownConnection(self)

	if (!self.config.host) {
		self.updateStatus(InstanceStatus.BadConfig, 'No IP address configured')
		return
	}

	const conn = self.conn
	conn.cycleStartTime = Date.now()
	conn.lastRxTime = conn.cycleStartTime

	self.log('info', `Opening connection to ${self.config.host}:${DEFAULT_PORT}`)
	self.updateStatus(InstanceStatus.Connecting)

	const socket = new TCPHelper(self.config.host, DEFAULT_PORT, { reconnect: true })
	self.socket = socket

	socket.on('error', (err) => {
		stopPolling(self)
		conn.isAuthenticated = false
		conn.authSent = false
		conn.rxBuffer = ''
		self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		if (self.config.verbose) {
			self.log('warn', 'Error: ' + err.message)
		}
	})

	socket.on('connect', () => {
		// A fresh session: the device prompts for the password before accepting
		// commands, and anything buffered from a previous session is stale.
		conn.rxBuffer = ''
		conn.isAuthenticated = false
		conn.authSent = false
		conn.lastRxTime = Date.now()
		self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
	})

	socket.on('end', () => {
		stopPolling(self)
		conn.isAuthenticated = false
		conn.authSent = false
		conn.rxBuffer = ''
		self.updateStatus(InstanceStatus.Disconnected)
	})

	socket.on('data', (buffer) => {
		processIncomingData(self, buffer.toString('utf8'))
	})

	startWatchdog(self)
}

export function teardownConnection(self: ModuleInstance): void {
	stopPolling(self)
	stopWatchdog(self)
	stopDebounce(self)

	for (const timer of self.pressTimers) {
		clearTimeout(timer)
	}
	self.pressTimers.clear()

	if (self.socket) {
		try {
			self.socket.destroy()
		} catch {
			// already gone; nothing to release
		}
		self.socket = undefined
	}

	const conn = self.conn
	conn.rxBuffer = ''
	conn.isAuthenticated = false
	conn.authSent = false
	// authFailed deliberately survives: it is cleared on a successful login and
	// on an explicit config change, so an automatic retry cannot walk back into
	// a lockout.
}

/** Rebuild the connection from scratch. Used by the watchdog. */
function forceReconnect(self: ModuleInstance, reason: string): void {
	if (self.conn.authFailed) return
	self.log('warn', `Reconnecting: ${reason}`)
	initConnection(self)
}

// ───────────────────────────── watchdog ─────────────────────────────
//
// TCPHelper only reconnects on socket 'error'/'end'. A network path that dies
// without a FIN or RST — cable pull, Wi-Fi drop, switch power-cycle — fires
// neither, so without this the module reports Ok against a dead socket
// indefinitely.

function startWatchdog(self: ModuleInstance): void {
	stopWatchdog(self)
	self.conn.watchdogTimer = setInterval(() => {
		watchdogTick(self)
	}, WATCHDOG_TICK_MS)
}

function stopWatchdog(self: ModuleInstance): void {
	if (self.conn.watchdogTimer) {
		clearInterval(self.conn.watchdogTimer)
		self.conn.watchdogTimer = undefined
	}
}

function watchdogTick(self: ModuleInstance): void {
	const conn = self.conn
	if (conn.authFailed) return // a rejected password will not fix itself

	const now = Date.now()
	const quietFor = now - conn.lastRxTime
	const connected = self.socket?.isConnected === true

	if (connected && conn.isAuthenticated) {
		// Silence is only evidence of a dead link while we are actually asking the
		// device for something. With polling off the device is expected to stay
		// quiet, so these tiers would misfire — and the nudge would be traffic the
		// original module never sent.
		if (!self.config.polling) return
		if (quietFor > RECONNECT_AFTER_MS) {
			forceReconnect(self, `no response from the switcher for ${Math.round(quietFor / 1000)}s`)
		} else if (quietFor > NUDGE_AFTER_MS) {
			sendRawCommand(self, WATCHDOG_NUDGE)
		}
		return
	}

	if (connected) {
		if (quietFor > AUTH_STALL_MS) {
			forceReconnect(self, 'authentication stalled')
		}
		return
	}

	// Not connected. A connect attempt to an unreachable host can sit for ~21s on
	// Windows, so recycle periodically to keep attempts fresh.
	if (now - Math.max(conn.lastRxTime, conn.cycleStartTime) > UNREACHABLE_RECYCLE_MS) {
		forceReconnect(self, 'still unreachable - retrying with a fresh connection')
	}
}

// ───────────────────────────── polling ─────────────────────────────

export function startPolling(self: ModuleInstance): void {
	stopPolling(self)

	if (!self.config.polling) {
		self.log('info', 'Polling is disabled. Module will not request new data at a regular rate.')
		return
	}

	// Clamped again here because a stored config from an older version, or a raw
	// config edit, can hold a rate below the field minimum.
	const configured = self.config.pollingrate > 0 ? self.config.pollingrate : 1000
	const rate = Math.max(MIN_POLL_RATE_MS, configured)
	self.log('info', `Starting Update Interval: Fetching new data from Device every ${rate}ms.`)
	self.pollTimer = setInterval(() => {
		requestPolledData(self)
	}, rate)
}

export function stopPolling(self: ModuleInstance): void {
	if (self.pollTimer) {
		clearInterval(self.pollTimer)
		self.pollTimer = undefined
	}
}

/** Request every polled state item — identical request set to the original module. */
function requestPolledData(self: ModuleInstance): void {
	// PnP/Key on-air states and sources
	for (const key of ['1B', '1C', '1D', '1E']) {
		sendRawCommand(self, `RQH:00${key}00,000001;`) // on PGM
		sendRawCommand(self, `RQH:00${key}01,000001;`) // on PVW
	}
	for (const key of ['1B', '1C', '1D', '1E']) {
		sendRawCommand(self, `RQH:00${key}02,000001;`) // source
	}

	// Aux sources and mutes
	sendRawCommand(self, 'RQH:000011,000001;')
	sendRawCommand(self, 'RQH:00002E,000001;')
	sendRawCommand(self, 'RQH:00002F,000001;')
	sendRawCommand(self, 'RQH:012203,000001;')
	sendRawCommand(self, 'RQH:012503,000001;')
	sendRawCommand(self, 'RQH:012603,000001;')

	// Freeze state
	sendRawCommand(self, 'RQH:020500,000001;')

	// Output assigns
	for (const addr of ['00000A', '00000B', '00000C', '00000D', '00000E', '00000F', '000010']) {
		sendRawCommand(self, `RQH:${addr},000001;`)
	}

	// Aux link state
	sendRawCommand(self, 'RQH:02010D,000001;')
	sendRawCommand(self, 'RQH:020154,000001;')
	sendRawCommand(self, 'RQH:020155,000001;')
	sendRawCommand(self, 'RQH:020156,000001;')

	// Memory names used to be re-read here on every cycle: 240 of the 271 requests
	// a cycle cost, for eight characters each of thirty names that only change when
	// someone renames a memory on the panel. They are fetched once at login and
	// refreshed occasionally instead, in the same position in the sequence.
	const conn = self.conn
	conn.pollCycle += 1
	if (conn.pollCycle % MEMORY_NAME_REFRESH_CYCLES === 0) {
		requestMemoryNames(self)
	}

	// Last memory loaded
	sendRawCommand(self, 'RQH:0A0003,000001;')
}

/** Read every character of every memory name. 240 requests - not for every cycle. */
function requestMemoryNames(self: ModuleInstance): void {
	for (let memory = 0; memory < MEMORY_COUNT; memory++) {
		for (let char = 0; char < MEMORY_NAME_LENGTH; char++) {
			sendRawCommand(self, `RQH:60${hex2(memory)}${hex2(char)},000001;`)
		}
	}
}

function subscribeToTally(self: ModuleInstance): void {
	sendRawCommand(self, 'DTH:0C0100,01;')
}

// ───────────────────────────── sending ─────────────────────────────

/** Send a DTH set command. The value is interpolated verbatim (see wire format note). */
export function sendCommand(self: ModuleInstance, address: string, value: string | number): void {
	sendRawCommand(self, `DTH:${address},${value};\n`)
}

export function sendRawCommand(self: ModuleInstance, command: string): void {
	const cmd = command + '\n'

	if (self.socket && self.socket.isConnected) {
		if (self.config.verbose) {
			self.log('debug', 'Sending: ' + cmd)
		}
		self.socket.send(cmd)
	} else if (self.config.verbose) {
		self.log('warn', 'Unable to send: Socket not connected.')
	}
}

function logVerbose(self: ModuleInstance, message: string): void {
	if (self.config.verbose) {
		self.log('debug', message)
	}
}

/**
 * Convert a scaled value into the two 7-bit bytes the device expects.
 * From Roland: due to MIDI protocol restrictions, 8-bit data must be separated
 * into 7-bit sections; two 7-bit bytes contain 14-bit data.
 */
export function calculateBytes(value: number, scale = 10): [number, number] {
	const scaled = Math.round(value * scale) & 0x3fff
	const lsb = scaled & 0x7f
	const msb = (scaled >> 7) & 0x7f
	return [msb, lsb]
}

// ───────────────────────── receiving & framing ─────────────────────────

/**
 * Text the device sends with no terminator, so it can never reach the frame
 * splitter below and has to be matched against the raw buffer. Each match is cut
 * out where it sits, leaving anything that arrived around it in the same TCP
 * segment intact.
 */
const RAW_MARKERS: { re: RegExp; handle: (self: ModuleInstance) => void }[] = [
	{ re: /enter password:[ \t]*/i, handle: onPasswordPrompt },
	{ re: /welcome to v-160hd\.?/i, handle: onAuthenticated },
	{ re: /wait a moment[^\r\n]*/i, handle: onLockout },
	{ re: /authentication error[^\r\n]*/i, handle: onAuthRejected },
]

export function processIncomingData(self: ModuleInstance, data: string): void {
	const conn = self.conn
	conn.lastRxTime = Date.now()
	logVerbose(self, data)

	conn.rxBuffer += data

	try {
		consumeRawMarkers(self)

		let stateChanged = false
		while (conn.rxBuffer.length > 0) {
			const semi = conn.rxBuffer.indexOf(';')
			const nl = conn.rxBuffer.indexOf('\n')
			if (semi < 0 && nl < 0) break // incomplete — wait for the rest

			const useSemi = semi >= 0 && (nl < 0 || semi < nl)
			const cut = useSemi ? semi : nl
			const part = normalizePart(conn.rxBuffer.slice(0, cut + 1))
			conn.rxBuffer = conn.rxBuffer.slice(cut + 1)

			if (part === '') continue
			if (useSemi) {
				if (handleFrame(self, part)) stateChanged = true
			} else {
				logVerbose(self, 'Received text: ' + part)
			}
		}

		// Whatever is left is an incomplete frame. Past the limit it is not a frame
		// at all, and keeping a tail would only hand the parser a fragment cut
		// through the middle of a value.
		if (conn.rxBuffer.length > RX_BUFFER_LIMIT) {
			self.log('warn', 'Receive buffer overflowed with no complete frame - discarding')
			conn.rxBuffer = ''
		}

		if (stateChanged) scheduleStateUpdate(self)
	} catch (error) {
		self.log('error', 'Error parsing incoming data: ' + String(error))
		self.log('error', 'Data: ' + data)
		conn.rxBuffer = ''
	}
}

function consumeRawMarkers(self: ModuleInstance): void {
	for (;;) {
		const buffer = self.conn.rxBuffer
		let earliest: { index: number; length: number; handle: (self: ModuleInstance) => void } | undefined

		for (const marker of RAW_MARKERS) {
			const hit = marker.re.exec(buffer)
			if (hit && (earliest === undefined || hit.index < earliest.index)) {
				earliest = { index: hit.index, length: hit[0].length, handle: marker.handle }
			}
		}

		if (!earliest) return
		self.conn.rxBuffer = buffer.slice(0, earliest.index) + buffer.slice(earliest.index + earliest.length)
		earliest.handle(self)
	}
}

/**
 * Strip the STX/XON/XOFF wrapping and the terminator, then drop any leading
 * punctuation left behind by a consumed marker — every frame the device sends
 * starts with a letter (DTH/RQH/VER/ACK/ERR), so stray bytes cannot be part of one.
 */
function normalizePart(raw: string): string {
	return raw
		.replace(/[\r\n;]+$/, '')
		.replace(/^[^A-Za-z]+/, '')
		.trim()
}

/** Returns true when the frame changed cached state. */
function handleFrame(self: ModuleInstance, frame: string): boolean {
	if (/^ACK$/i.test(frame)) return false

	if (/^ERR:/i.test(frame)) {
		// The original module only recognised ERR:0 and silently dropped the rest
		self.log('warn', `Switcher reported an error: ${frame};`)
		return false
	}

	const [prefixPart, ...rest] = frame.split(':')
	const prefix = prefixPart.trim()
	if (rest.length === 0) {
		logVerbose(self, 'Unmatched data: ' + frame)
		return false
	}

	const [params, value] = rest.join(':').split(',')

	if (prefix.includes('VER')) {
		self.state.model = params ?? self.state.model
		self.state.version = value ?? self.state.version
		return true
	}

	if (prefix.includes('DTH') && params !== undefined && params.length === 6 && value !== undefined) {
		handleReport(self, params.slice(0, 2), params.slice(2, 4), params.slice(4, 6), value)
		return true
	}

	logVerbose(self, 'Unmatched data: ' + frame)
	return false
}

// ───────────────────────────── login ─────────────────────────────

function onPasswordPrompt(self: ModuleInstance): void {
	const conn = self.conn

	if (conn.authSent) {
		// A second prompt means the first password was refused. The switcher locks
		// out after repeated attempts and then rejects even the correct password,
		// so it must never be answered twice.
		conn.authFailed = true
		stopPolling(self)
		self.updateStatus(InstanceStatus.ConnectionFailure, 'Password rejected')
		self.log('error', 'The switcher rejected the password. Check the passcode in the module configuration.')
		return
	}

	conn.authSent = true
	self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
	self.log('info', 'Sending passcode')
	self.socket?.send(getPassword(self) + '\n')
}

function onAuthenticated(self: ModuleInstance): void {
	const conn = self.conn
	if (conn.isAuthenticated) return // the banner can repeat; set up once

	conn.isAuthenticated = true
	conn.authFailed = false
	self.updateStatus(InstanceStatus.Ok)
	self.log('info', 'Authenticated.')

	sendRawCommand(self, 'VER') // request version info
	startPolling(self)
	subscribeToTally(self)
	// Sent after the tally subscription so 240 requests cannot delay it
	requestMemoryNames(self)
}

function onAuthRejected(self: ModuleInstance): void {
	self.conn.authFailed = true
	stopPolling(self)
	self.updateStatus(InstanceStatus.ConnectionFailure, 'Authentication error')
	self.log('error', 'The switcher reported an authentication error. Check the passcode in the module configuration.')
}

function onLockout(self: ModuleInstance): void {
	self.conn.authFailed = true
	stopPolling(self)
	self.updateStatus(InstanceStatus.ConnectionFailure, 'Switcher is refusing logins')
	self.log(
		'error',
		'The switcher replied "Wait a moment": it has temporarily locked out logins after repeated attempts. Wait before retrying.',
	)
}

// ──────────────────── state fan-out (debounced) ────────────────────

/**
 * A poll cycle answers with hundreds of frames across many TCP segments.
 * Coalesce them into one feedback and variable pass instead of running one per
 * segment.
 */
function scheduleStateUpdate(self: ModuleInstance): void {
	stopDebounce(self)
	self.conn.debounceTimer = setTimeout(() => {
		self.conn.debounceTimer = undefined
		self.checkAllFeedbacks()
		updateVariableValues(self)
	}, FEEDBACK_DEBOUNCE_MS)
}

function stopDebounce(self: ModuleInstance): void {
	if (self.conn.debounceTimer) {
		clearTimeout(self.conn.debounceTimer)
		self.conn.debounceTimer = undefined
	}
}

function handleReport(self: ModuleInstance, param1: string, param2: string, param3: string, value: string): void {
	const state = self.state

	if (param1 === '0C' && param2 === '00' && param3 === '00') {
		// Bulk tally push (subscribed): one 2-char status per tally input
		logVerbose(self, 'Received Subscribe Tally Message')
		for (let input = 0; input < value.length / 2; input++) {
			const status = parseInt(value.slice(input * 2, input * 2 + 2), 16)
			state.tally.set(input, Number.isNaN(status) ? 0 : status)
		}
		return
	}

	if (param1 === '00') {
		if (param2 === '00' && param3 === '11') {
			logVerbose(self, 'Received Aux 1 Source: ' + value)
			state.aux1source = value
		} else if (param2 === '00' && param3 === '2E') {
			logVerbose(self, 'Received Aux 2 Source: ' + value)
			state.aux2source = value
		} else if (param2 === '00' && param3 === '2F') {
			logVerbose(self, 'Received Aux 3 Source: ' + value)
			state.aux3source = value
		} else if (param3 === '02' && ['1B', '1C', '1D', '1E'].includes(param2)) {
			const keyNumber = parseInt(param2, 16) - 0x1b + 1
			state.pnpkeySource.set(keyNumber, value)
			logVerbose(self, `Received PnP/Key ${keyNumber} Source: ` + value)
			const lookup = CHOICES_PNPKEY_SOURCES.find((item) => item.id === value)
			if (lookup) {
				state.pnpkeySourceName.set(keyNumber, lookup.label)
			} else {
				// Leaving the previous name in place would misreport the source
				state.pnpkeySourceName.set(keyNumber, `Unknown (${value})`)
			}
		} else {
			// Generic storage for every other requested '00'-page address
			state.values.set(`${param1}${param2}${param3}`, value)
			state.values.set(`${param2}${param3}`, value)
		}
	}

	if (param1 === '02' && param2 === '05' && param3 === '00') {
		state.freeze = value
		logVerbose(self, 'Received Freeze State: ' + value)
	}

	if (param1 === '01' && param3 === '03') {
		if (param2 === '22') state.aux1mute = value
		else if (param2 === '25') state.aux2mute = value
		else if (param2 === '26') state.aux3mute = value
	}

	if (param1 === '00' && param2 === '00') {
		if (param3 === '0A') state.hdmi1assign = value
		else if (param3 === '0B') state.hdmi2assign = value
		else if (param3 === '0C') state.hdmi3assign = value
		else if (param3 === '0D') state.sdi1assign = value
		else if (param3 === '0E') state.sdi2assign = value
		else if (param3 === '0F') state.sdi3assign = value
		else if (param3 === '10') state.usbassign = value
	}

	if (param1 === '02' && param2 === '01') {
		if (param3 === '0D') state.auxlinkmode = value
		else if (param3 === '54') state.aux1link = value
		else if (param3 === '55') state.aux2link = value
		else if (param3 === '56') state.aux3link = value
	}

	if (param1 === '60') {
		// Memory names: each character arrives as its own message, not necessarily
		// in order. The debounced fan-out publishes the reassembled name; writing it
		// here too would mean 240 variable writes per poll cycle.
		const memoryNumber = parseInt(param2, 16)
		const charIndex = parseInt(param3, 16)
		if (memoryNumber >= 0 && memoryNumber < MEMORY_COUNT && charIndex >= 0 && charIndex < MEMORY_NAME_LENGTH) {
			state.memoryNameChars[memoryNumber][charIndex] = value
		}
	}

	if (param1 === '0A' && param2 === '00' && param3 === '03') {
		const reported = parseInt(value, 16)
		state.lastMemory = Number.isNaN(reported) ? undefined : reported
	}
}
