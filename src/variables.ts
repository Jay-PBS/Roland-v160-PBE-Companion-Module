import type { CompanionVariableValues } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { CHOICES_OUTPUTSASSIGN, CHOICES_PGMPVW_SELECT, TALLY_INPUTS } from './constants.js'
import { MEMORY_COUNT, decodeMemoryName } from './state.js'

// Variable ids are partly dynamic (per tally input, per memory), so the schema
// uses the base library's open value map rather than a closed key list.
export type VariablesSchema = CompanionVariableValues

export function UpdateVariableDefinitions(self: ModuleInstance): void {
	const definitions: Record<string, { name: string }> = {
		model: { name: 'Model' },
		version: { name: 'Version' },
	}

	for (const tally of TALLY_INPUTS) {
		definitions[`tally_${tally.shortlabel}`] = { name: `${tally.label} Tally` }
	}

	for (let key = 1; key <= 4; key++) {
		definitions[`pnpkey${key}_pgm`] = { name: `PnP/Key ${key} on PGM` }
		definitions[`pnpkey${key}_pvw`] = { name: `PnP/Key ${key} on PVW` }
		definitions[`pnpkey${key}_source`] = { name: `PnP/Key ${key} Source` }
	}

	definitions.hdmi1 = { name: 'HDMI Output 1 Source' }
	definitions.hdmi2 = { name: 'HDMI Output 2 Source' }
	definitions.hdmi3 = { name: 'HDMI Output 3 Source' }
	definitions.sdi1 = { name: 'SDI Output 1 Source' }
	definitions.sdi2 = { name: 'SDI Output 2 Source' }
	definitions.sdi3 = { name: 'SDI Output 3 Source' }
	definitions.usb = { name: 'USB Output Source' }

	definitions.aux1 = { name: 'Aux 1 Source' }
	definitions.aux2 = { name: 'Aux 2 Source' }
	definitions.aux3 = { name: 'Aux 3 Source' }
	definitions.aux1_mute = { name: 'Aux 1 Mute' }
	definitions.aux2_mute = { name: 'Aux 2 Mute' }
	definitions.aux3_mute = { name: 'Aux 3 Mute' }

	definitions.auxlink_mode = { name: 'Aux Link Mode' }
	definitions.aux1link = { name: 'Aux 1 Link' }
	definitions.aux2link = { name: 'Aux 2 Link' }
	definitions.aux3link = { name: 'Aux 3 Link' }

	definitions.freeze = { name: 'Freeze On/Off' }

	for (let i = 1; i <= MEMORY_COUNT; i++) {
		definitions[`memoryname_${i}`] = { name: `Memory ${i} Name` }
	}
	definitions.lastmemorynumber = { name: 'Last Memory Number Loaded' }
	definitions.lastmemoryname = { name: 'Last Memory Name Loaded' }

	self.setVariableDefinitions(definitions)
}

function onOff(value: string | undefined): string {
	return value === '01' ? 'On' : 'Off'
}

function lookupLabel(choices: { id: string | number; label: string }[], value: string | undefined): string | undefined {
	if (value === undefined) return undefined
	const found = choices.find((c) => c.id === value)
	return found ? found.label : value
}

/** Push the current state cache into the variable values. */
export function updateVariableValues(self: ModuleInstance): void {
	const state = self.state
	const values: CompanionVariableValues = {
		model: state.model,
		version: state.version,
	}

	for (const tally of TALLY_INPUTS) {
		const status = state.tally.get(tally.id) ?? 0
		values[`tally_${tally.shortlabel}`] = status === 1 || status === 3 ? 'Program' : status === 2 ? 'Preview' : 'Off'
	}

	const keyAddresses = ['1B', '1C', '1D', '1E']
	for (let key = 1; key <= 4; key++) {
		values[`pnpkey${key}_pgm`] = onOff(state.values.get(`${keyAddresses[key - 1]}00`))
		values[`pnpkey${key}_pvw`] = onOff(state.values.get(`${keyAddresses[key - 1]}01`))
		values[`pnpkey${key}_source`] = state.pnpkeySourceName.get(key)
	}

	values.hdmi1 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.hdmi1assign)
	values.hdmi2 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.hdmi2assign)
	values.hdmi3 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.hdmi3assign)
	values.sdi1 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.sdi1assign)
	values.sdi2 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.sdi2assign)
	values.sdi3 = lookupLabel(CHOICES_OUTPUTSASSIGN, state.sdi3assign)
	values.usb = lookupLabel(CHOICES_OUTPUTSASSIGN, state.usbassign)

	values.aux1 = lookupLabel(CHOICES_PGMPVW_SELECT, state.aux1source)
	values.aux2 = lookupLabel(CHOICES_PGMPVW_SELECT, state.aux2source)
	values.aux3 = lookupLabel(CHOICES_PGMPVW_SELECT, state.aux3source)

	values.aux1_mute = onOff(state.aux1mute)
	values.aux2_mute = onOff(state.aux2mute)
	values.aux3_mute = onOff(state.aux3mute)

	values.auxlink_mode = state.auxlinkmode === '01' ? 'Auto Link' : state.auxlinkmode === '02' ? 'Manual Link' : 'Off'
	values.aux1link = onOff(state.aux1link)
	values.aux2link = onOff(state.aux2link)
	values.aux3link = onOff(state.aux3link)

	values.freeze = onOff(state.freeze)

	for (let i = 0; i < MEMORY_COUNT; i++) {
		values[`memoryname_${i + 1}`] = decodeMemoryName(state.memoryNameChars[i])
	}
	if (state.lastMemory !== undefined) {
		values.lastmemorynumber = state.lastMemory
		values.lastmemoryname = decodeMemoryName(state.memoryNameChars[state.lastMemory] ?? [])
	}

	self.setVariableValues(values)
}
