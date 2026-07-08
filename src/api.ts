import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { CHOICES_PNPKEY_SOURCES, hex2 } from './constants.js'
import { MEMORY_COUNT, MEMORY_NAME_LENGTH, decodeMemoryName } from './state.js'
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

export function initConnection(self: ModuleInstance): void {
	if (self.socket) {
		self.socket.destroy()
		self.socket = undefined
	}

	if (!self.config.host) {
		self.updateStatus(InstanceStatus.BadConfig, 'No IP address configured')
		return
	}

	self.log('info', `Opening connection to ${self.config.host}:${DEFAULT_PORT}`)
	self.updateStatus(InstanceStatus.Connecting)

	const socket = new TCPHelper(self.config.host, DEFAULT_PORT)
	self.socket = socket

	socket.on('error', (err) => {
		stopPolling(self)
		self.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		if (self.config.verbose) {
			self.log('warn', 'Error: ' + err.message)
		}
	})

	socket.on('connect', () => {
		// The device prompts for the password before accepting commands
		self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
	})

	socket.on('end', () => {
		stopPolling(self)
		self.updateStatus(InstanceStatus.Disconnected)
	})

	socket.on('data', (buffer) => {
		processIncomingData(self, buffer.toString('utf8'))
	})
}

export function teardownConnection(self: ModuleInstance): void {
	stopPolling(self)

	for (const timer of self.pressTimers) {
		clearTimeout(timer)
	}
	self.pressTimers.clear()

	if (self.socket) {
		self.socket.destroy()
		self.socket = undefined
	}
}

export function startPolling(self: ModuleInstance): void {
	stopPolling(self)

	if (!self.config.polling) {
		self.log('info', 'Polling is disabled. Module will not request new data at a regular rate.')
		return
	}

	const rate = self.config.pollingrate > 0 ? self.config.pollingrate : 1000
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

	// Memory names (one request per character) and last memory loaded
	for (let memory = 0; memory < MEMORY_COUNT; memory++) {
		for (let char = 0; char < MEMORY_NAME_LENGTH; char++) {
			sendRawCommand(self, `RQH:60${hex2(memory)}${hex2(char)},000001;`)
		}
	}
	sendRawCommand(self, 'RQH:0A0003,000001;')
}

function subscribeToTally(self: ModuleInstance): void {
	sendRawCommand(self, 'DTH:0C0100,01;')
}

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

export function processIncomingData(self: ModuleInstance, data: string): void {
	if (self.config.verbose) {
		self.log('debug', data)
	}

	const trimmed = data.trim()

	if (trimmed === 'Enter password:') {
		self.updateStatus(InstanceStatus.Connecting, 'Authenticating')
		self.log('info', 'Sending passcode')
		self.socket?.send(self.config.password + '\n')
		return
	}

	if (trimmed === 'Welcome to V-160HD.') {
		self.updateStatus(InstanceStatus.Ok)
		self.log('info', 'Authenticated.')
		sendRawCommand(self, 'VER') // request version info
		startPolling(self)
		subscribeToTally(self)
		return
	}

	if (trimmed === 'ERR:0;') {
		// The device rejected something it received; nothing to update
		return
	}

	try {
		for (const rawGroup of trimmed.split(';')) {
			const group = rawGroup.trim()
			if (group === '' || group === 'ACK') continue

			const [prefixPart, ...rest] = group.split(':')
			const prefix = prefixPart.trim()
			if (rest.length === 0) continue

			const [params, value] = rest.join(':').split(',')

			if (prefix.includes('VER')) {
				self.state.model = params ?? self.state.model
				self.state.version = value ?? self.state.version
				continue
			}

			if (prefix.includes('DTH') && params !== undefined && params.length === 6 && value !== undefined) {
				handleReport(self, params.slice(0, 2), params.slice(2, 4), params.slice(4, 6), value)
			}
		}

		// Now update feedbacks and variables from the refreshed state
		self.checkAllFeedbacks()
		updateVariableValues(self)
	} catch (error) {
		self.log('error', 'Error parsing incoming data: ' + String(error))
		self.log('error', 'Data: ' + data)
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
		// Memory names: each character arrives as its own message, not necessarily in order
		const memoryNumber = parseInt(param2, 16)
		const charIndex = parseInt(param3, 16)
		if (memoryNumber >= 0 && memoryNumber < MEMORY_COUNT && charIndex >= 0 && charIndex < MEMORY_NAME_LENGTH) {
			state.memoryNameChars[memoryNumber][charIndex] = value
			self.setVariableValues({
				[`memoryname_${memoryNumber + 1}`]: decodeMemoryName(state.memoryNameChars[memoryNumber]),
			})
		}
	}

	if (param1 === '0A' && param2 === '00' && param3 === '03') {
		state.lastMemory = parseInt(value, 16)
		self.setVariableValues({
			lastmemorynumber: state.lastMemory,
			lastmemoryname: decodeMemoryName(state.memoryNameChars[state.lastMemory] ?? []),
		})
	}
}
