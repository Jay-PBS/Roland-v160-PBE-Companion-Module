import type { DropdownChoice } from '@companion-module/base'

/** Format a number as a 2-digit uppercase hex string, e.g. 10 -> '0A'. */
export function hex2(value: number): string {
	return value.toString(16).padStart(2, '0').toUpperCase()
}

export interface TallyInput {
	id: number
	label: string
	shortlabel: string
}

function makeTallyInputs(prefix: string, short: string, count: number, startId: number): TallyInput[] {
	const entries: TallyInput[] = []
	for (let i = 1; i <= count; i++) {
		entries.push({ id: startId + i - 1, label: `${prefix} ${i}`, shortlabel: `${short}${i}` })
	}
	return entries
}

/** The inputs the switcher reports tally for, in device order. */
export const TALLY_INPUTS: TallyInput[] = [
	...makeTallyInputs('HDMI', 'hdmi', 8, 0),
	...makeTallyInputs('SDI', 'sdi', 8, 8),
	...makeTallyInputs('STILL', 'still', 16, 16),
	...makeTallyInputs('XPT', 'xpt', 10, 32),
]

function makeChoices(prefix: string, count: number, makeId: (index: number) => string | number): DropdownChoice[] {
	const choices: DropdownChoice[] = []
	for (let i = 1; i <= count; i++) {
		choices.push({ id: makeId(i - 1), label: `${prefix} ${i}` })
	}
	return choices
}

/** Input channels 1-10 (value = zero-based channel index). */
export const CHOICES_INPUTS: DropdownChoice[] = makeChoices('Input', 10, (i) => i)

/** Sources assignable to an input channel (value = zero-based source index). */
export const CHOICES_INPUTSASSIGN: DropdownChoice[] = [
	...makeChoices('HDMI', 8, (i) => i),
	...makeChoices('SDI', 8, (i) => i + 8),
	...makeChoices('Still', 16, (i) => i + 16),
]

/** Physical outputs (value = the device address of the output-assign parameter). */
export const CHOICES_OUTPUTS: DropdownChoice[] = [
	{ id: '00000A', label: 'HDMI Output 1' },
	{ id: '00000B', label: 'HDMI Output 2' },
	{ id: '00000C', label: 'HDMI Output 3' },
	{ id: '00000D', label: 'SDI Output 1' },
	{ id: '00000E', label: 'SDI Output 2' },
	{ id: '00000F', label: 'SDI Output 3' },
	{ id: '000110', label: 'USB Output' },
]

/** Buses assignable to an output (value = hex value byte). */
export const CHOICES_OUTPUTSASSIGN: DropdownChoice[] = [
	{ id: '00', label: 'Program' },
	{ id: '01', label: 'Sub Program' },
	{ id: '02', label: 'Preview' },
	{ id: '03', label: 'Aux 1' },
	{ id: '04', label: 'Aux 2' },
	{ id: '05', label: 'Aux 3' },
	{ id: '06', label: 'DSK 1 Source' },
	{ id: '07', label: 'DSK 2 Source' },
	{ id: '08', label: 'Multi-View' },
	{ id: '09', label: '16 Input-View' },
	{ id: '0A', label: '16 Still-View' },
]

/** Program/Sub-Program layer enable targets (value = decimal parameter index). */
export const CHOICES_PINPDSK: DropdownChoice[] = [
	{ id: 18, label: 'Program Layer PinP & Key 1' },
	{ id: 19, label: 'Program Layer PinP & Key 2' },
	{ id: 20, label: 'Program Layer PinP & Key 3' },
	{ id: 21, label: 'Program Layer PinP & Key 4' },
	{ id: 22, label: 'Program Layer DSK 1' },
	{ id: 23, label: 'Program Layer DSK 2' },
	{ id: 24, label: 'Sub Program Layer PinP & Key 1' },
	{ id: 25, label: 'Sub Program Layer PinP & Key 2' },
	{ id: 26, label: 'Sub Program Layer PinP & Key 3' },
	{ id: 27, label: 'Sub Program Layer PinP & Key 4' },
	{ id: 28, label: 'Sub Program Layer DSK 1' },
	{ id: 29, label: 'Sub Program Layer DSK 2' },
]

/** Transition-time targets (value = the device address to write the time to). */
export const CHOICES_TRANSITION_TIME_TYPES: DropdownChoice[] = [
	{ id: '001700', label: 'Mix/Wipe Time' },
	{ id: '001701', label: 'PinP 1 Time' },
	{ id: '001702', label: 'PinP 2 Time' },
	{ id: '001703', label: 'PinP 3 Time' },
	{ id: '001704', label: 'PinP 4 Time' },
	{ id: '001705', label: 'DSK 1 Time' },
	{ id: '001706', label: 'DSK 2 Time' },
	{ id: '001707', label: 'Output Fade Time' },
]

export const CHOICES_TRANSITION_TYPES: DropdownChoice[] = [
	{ id: 0, label: 'Mix' },
	{ id: 1, label: 'Wipe' },
]

export const CHOICES_MIX_TYPES: DropdownChoice[] = [
	{ id: 0, label: 'Mix' },
	{ id: 1, label: 'Fam' },
	{ id: 2, label: 'Nam' },
]

export const CHOICES_WIPE_TYPES: DropdownChoice[] = [
	{ id: 0, label: 'Horizontal' },
	{ id: 1, label: 'Vertical' },
	{ id: 2, label: 'Upper Left' },
	{ id: 3, label: 'Upper Right' },
	{ id: 4, label: 'Lower Left' },
	{ id: 5, label: 'Lower Right' },
	{ id: 6, label: 'H-Center' },
	{ id: 7, label: 'V-Center' },
]

export const CHOICES_WIPE_DIRECTIONS: DropdownChoice[] = [
	{ id: 0, label: 'Normal' },
	{ id: 1, label: 'Reverse' },
	{ id: 2, label: 'Round Trip' },
]

/** PinP & Key selection for the legacy numeric actions (value = decimal parameter index). */
export const CHOICES_PINP_KEYS: DropdownChoice[] = [
	{ id: 27, label: 'PinP & Key 1' },
	{ id: 28, label: 'PinP & Key 2' },
	{ id: 29, label: 'PinP & Key 3' },
	{ id: 30, label: 'PinP & Key 4' },
]

export const CHOICES_PINP_TYPES: DropdownChoice[] = [
	{ id: 0, label: 'PinP' },
	{ id: 1, label: 'Luminance-White Key' },
	{ id: 2, label: 'Luminance-Black Key' },
	{ id: 3, label: 'Chroma Key' },
]

/** PinP & Key selection by address byte (used by most PinP actions). */
export const CHOICES_PNPKEY_HEX: DropdownChoice[] = [
	{ id: '1B', label: 'PnP/Key 1' },
	{ id: '1C', label: 'PnP/Key 2' },
	{ id: '1D', label: 'PnP/Key 3' },
	{ id: '1E', label: 'PnP/Key 4' },
]

/** DSK selection for the legacy numeric actions (value = decimal parameter index). */
export const CHOICES_DSK: DropdownChoice[] = [
	{ id: 31, label: 'DSK 1' },
	{ id: 32, label: 'DSK 2' },
]

/** DSK selection by address byte (used by dsk_busselect). */
export const CHOICES_DSK_HEX: DropdownChoice[] = [
	{ id: '1F', label: 'DSK 1' },
	{ id: '20', label: 'DSK 2' },
]

export const CHOICES_DSK_TYPES: DropdownChoice[] = [
	{ id: 0, label: 'Luminance-White Key' },
	{ id: 1, label: 'Luminance-Black Key' },
	{ id: 2, label: 'Chroma Key' },
]

/** Memories 1-30 (value = zero-based memory index). */
export const CHOICES_MEMORY: DropdownChoice[] = makeChoices('Memory', 30, (i) => i)

const SWITCH_LABELS: string[] = [
	...Array.from({ length: 10 }, (_, i) => `PGM/A ${i + 1} SW`),
	...Array.from({ length: 10 }, (_, i) => `PST/B ${i + 1} SW`),
	...Array.from({ length: 10 }, (_, i) => `AUX ${i + 1} SW`),
	'CUT SW',
	'AUTO SW',
	'TRANSITION SW',
	'MODE SW',
	'INPUT ASSIGN SW',
	'PGM-CENTER ENCODER',
	'PST-CENTER ENCODER',
	'SPLIT A SW',
	'SPLIT B SW',
	'AUTO MIXING',
	'CAPTURE SW',
	'USER 1 SW',
	'USER 2 SW',
	'USER 3 SW',
	'USER 4 SW',
	...[1, 2, 3, 4].flatMap((n) => [
		`PinP ${n} POSITION H`,
		`PinP ${n} POSITION V`,
		`PinP ${n} SOURCE SW`,
		`PinP ${n} PVW SW`,
		`PinP ${n} PGM SW`,
	]),
	...[1, 2].flatMap((n) => [`DSK ${n} SOURCE SW`, `DSK ${n} PVW SW`, `DSK ${n} PGM SW`]),
	'MONITOR 1 SW',
	'MONITOR 2 SW',
	'MONITOR 3 SW',
	'MONITOR 4 SW',
	'MENU SW',
	'EXIT SW',
	'ENTER SW',
	'OUTPUT FADE SW',
	'SEQUENCER ON SW',
	'SEQUENCER AUTO SW',
	'SEQUENCER PREV SW',
	'SEQUENCER NEXT SW',
]

/** Panel switches (value = the device address, '0B0000'..'0B0052'). */
export const CHOICES_SWITCHES: DropdownChoice[] = SWITCH_LABELS.map((label, i) => ({
	id: '0B00' + hex2(i),
	label,
}))

export const SWITCH_CUT = '0B001E'
export const SWITCH_AUTO = '0B001F'

/** Sources selectable on the PGM/PVW and Aux buses (value = hex value byte). */
export const CHOICES_PGMPVW_SELECT: DropdownChoice[] = [
	...makeChoices('INPUT', 20, (i) => hex2(i + 0x20)),
	...makeChoices('HDMI', 8, (i) => hex2(i)),
	...makeChoices('SDI', 8, (i) => hex2(i + 0x08)),
	...makeChoices('Still', 16, (i) => hex2(i + 0x10)),
]

/** Sources selectable as a PinP & Key source (value = hex value byte, ordered by value). */
export const CHOICES_PNPKEY_SOURCES: DropdownChoice[] = [
	...makeChoices('HDMI', 8, (i) => hex2(i)),
	...makeChoices('SDI', 8, (i) => hex2(i + 0x08)),
	...makeChoices('Still', 16, (i) => hex2(i + 0x10)),
	...makeChoices('Input', 20, (i) => hex2(i + 0x20)),
]

/** Cameras 1-16 (value = hex address byte '41'..'50'). */
export const CHOICES_CAMERAS: DropdownChoice[] = makeChoices('Camera', 16, (i) => hex2(i + 0x41))

export const CHOICES_CAMERA_PRESETS: DropdownChoice[] = [
	{ id: '7F', label: 'None' },
	...Array.from({ length: 10 }, (_, i) => ({ id: hex2(i), label: `${i + 1}` })),
]

/** Inputs selectable for freeze-select (value = hex address byte '02'..'11'). */
export const CHOICES_FREEZE_INPUTS: DropdownChoice[] = [
	...makeChoices('HDMI IN', 8, (i) => hex2(i + 0x02)),
	...makeChoices('SDI IN', 8, (i) => hex2(i + 0x0a)),
]

/** Inputs selectable as a camera tally source (value = hex value byte). */
export const CHOICES_CAMERA_TALLY_INPUTS: DropdownChoice[] = [
	...makeChoices('HDMI', 8, (i) => hex2(i)),
	...makeChoices('SDI', 8, (i) => hex2(i + 0x08)),
]

export const CHOICES_AUX_LINK_ADDRESSES: DropdownChoice[] = [
	{ id: '020154', label: 'Aux 1' },
	{ id: '020155', label: 'Aux 2' },
	{ id: '020156', label: 'Aux 3' },
]

export const CHOICES_AUX_SOURCE_ADDRESSES: DropdownChoice[] = [
	{ id: '000011', label: 'Aux 1' },
	{ id: '00002E', label: 'Aux 2' },
	{ id: '00002F', label: 'Aux 3' },
]

export const CHOICES_AUX_MUTE_ADDRESSES: DropdownChoice[] = [
	{ id: '012203', label: 'Aux 1' },
	{ id: '012503', label: 'Aux 2' },
	{ id: '012603', label: 'Aux 3' },
]

export const CHOICES_AUX_KEYS: DropdownChoice[] = [
	{ id: 'aux1', label: 'Aux 1' },
	{ id: 'aux2', label: 'Aux 2' },
	{ id: 'aux3', label: 'Aux 3' },
]

export const CHOICES_ONOFF: DropdownChoice[] = [
	{ id: '00', label: 'Off' },
	{ id: '01', label: 'On' },
]

export const CHOICES_ENABLE: DropdownChoice[] = [
	{ id: '00', label: 'Disable' },
	{ id: '01', label: 'Enable' },
]

export const CHOICES_BUS: DropdownChoice[] = [
	{ id: '00', label: 'Program (PGM)' },
	{ id: '01', label: 'Preview (PVW)' },
]

export const CHOICES_AUX_LINK_MODES: DropdownChoice[] = [
	{ id: '00', label: 'Off' },
	{ id: '01', label: 'Auto Link' },
	{ id: '02', label: 'Manual Link' },
]

export const CHOICES_PNPKEY_FADE: DropdownChoice[] = [
	{ id: '05', label: 'PnP/Key 1' },
	{ id: '06', label: 'PnP/Key 2' },
	{ id: '07', label: 'PnP/Key 3' },
	{ id: '08', label: 'PnP/Key 4' },
]

export const CHOICES_PNPKEY_SHAPES: DropdownChoice[] = [
	{ id: '00', label: 'Rectangle' },
	{ id: '01', label: 'Circle' },
	{ id: '02', label: 'Diamond' },
]

export const CHOICES_PNPKEY_BORDER_COLORS: DropdownChoice[] = [
	{ id: '00', label: 'White' },
	{ id: '01', label: 'Yellow' },
	{ id: '02', label: 'Cyan' },
	{ id: '03', label: 'Green' },
	{ id: '04', label: 'Magenta' },
	{ id: '05', label: 'Red' },
	{ id: '06', label: 'Blue' },
	{ id: '07', label: 'Black' },
	{ id: '08', label: 'Custom' },
	{ id: '09', label: 'Soft Edge' },
]

export const CHOICES_CHROMA_COLORS: DropdownChoice[] = [
	{ id: '00', label: 'Green' },
	{ id: '01', label: 'Blue' },
]

export const CHOICES_FREEZE_TYPES: DropdownChoice[] = [
	{ id: '00', label: 'All' },
	{ id: '01', label: 'Select' },
]

export const CHOICES_FOCUS: DropdownChoice[] = [
	{ id: '7F', label: 'Near' },
	{ id: '00', label: 'Stop' },
	{ id: '01', label: 'Far' },
]

export const CHOICES_EXPOSURE: DropdownChoice[] = [
	{ id: '00', label: 'Manual' },
	{ id: '01', label: 'Auto' },
]
