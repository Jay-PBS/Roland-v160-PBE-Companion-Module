export const MEMORY_COUNT = 30
export const MEMORY_NAME_LENGTH = 8

/**
 * Cache of the last state reported by the switcher. Feedbacks and variables
 * read from this; it is filled by the poll responses and tally subscription
 * parsed in api.ts.
 */
export interface V160State {
	model: string
	version: string
	/** Tally status per tally input id (see TALLY_INPUTS): 0=off, 1=program, 2=preview, 3=both */
	tally: Map<number, number>
	/**
	 * Generic address -> value cache. Every DTH report with an unrecognized
	 * address is stored under both its full 6-char address and the trailing
	 * 4 chars (e.g. PnP/Key on-air state '001B00' is readable as '1B00').
	 */
	values: Map<string, string>
	aux1source?: string
	aux2source?: string
	aux3source?: string
	aux1mute?: string
	aux2mute?: string
	aux3mute?: string
	hdmi1assign?: string
	hdmi2assign?: string
	hdmi3assign?: string
	sdi1assign?: string
	sdi2assign?: string
	sdi3assign?: string
	usbassign?: string
	auxlinkmode?: string
	aux1link?: string
	aux2link?: string
	aux3link?: string
	freeze?: string
	pnpkeySource: Map<number, string>
	pnpkeySourceName: Map<number, string>
	/** Memory name characters, [memory 0-29][char 0-7], each a 2-char hex char code */
	memoryNameChars: string[][]
	/** Zero-based index of the last memory loaded, as reported by the device */
	lastMemory?: number
	/** Camera selected via the 'Select Camera' action (hex address byte '41'..'50') */
	selectedCamera: string
}

export function createEmptyState(): V160State {
	const values = new Map<string, string>()
	// The original module pre-seeded the PnP/Key on-air states so feedbacks
	// evaluate to 'off' before the first poll completes.
	for (const key of ['1B', '1C', '1D', '1E']) {
		values.set(`${key}00`, '00')
		values.set(`${key}01`, '00')
	}

	return {
		model: 'V-160HD',
		version: '',
		tally: new Map(),
		values,
		pnpkeySource: new Map(),
		pnpkeySourceName: new Map(),
		memoryNameChars: Array.from({ length: MEMORY_COUNT }, () => new Array<string>(MEMORY_NAME_LENGTH).fill('20')),
		selectedCamera: '41',
	}
}

/** Decode a memory name from its per-character hex codes. */
export function decodeMemoryName(chars: string[]): string {
	return chars
		.map((c) => {
			const code = parseInt(c, 16)
			return Number.isNaN(code) || code < 0x20 || code > 0x7e ? ' ' : String.fromCharCode(code)
		})
		.join('')
		.trimEnd()
}
