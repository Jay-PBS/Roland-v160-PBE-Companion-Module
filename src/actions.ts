import type { CompanionInputFieldCheckbox, CompanionInputFieldDropdown } from '@companion-module/base'
import type ModuleInstance from './main.js'
import { calculateBytes, sendCommand } from './api.js'
import {
	CHOICES_AUX_LINK_ADDRESSES,
	CHOICES_AUX_LINK_MODES,
	CHOICES_AUX_MUTE_ADDRESSES,
	CHOICES_AUX_SOURCE_ADDRESSES,
	CHOICES_BUS,
	CHOICES_CAMERAS,
	CHOICES_CAMERA_PRESETS,
	CHOICES_CAMERA_TALLY_INPUTS,
	CHOICES_CHROMA_COLORS,
	CHOICES_DSK,
	CHOICES_DSK_HEX,
	CHOICES_DSK_TYPES,
	CHOICES_ENABLE,
	CHOICES_EXPOSURE,
	CHOICES_FOCUS,
	CHOICES_FREEZE_INPUTS,
	CHOICES_FREEZE_TYPES,
	CHOICES_INPUTS,
	CHOICES_INPUTSASSIGN,
	CHOICES_MEMORY,
	CHOICES_MIX_TYPES,
	CHOICES_ONOFF,
	CHOICES_OUTPUTS,
	CHOICES_OUTPUTSASSIGN,
	CHOICES_PGMPVW_SELECT,
	CHOICES_PINPDSK,
	CHOICES_PINP_KEYS,
	CHOICES_PINP_TYPES,
	CHOICES_PNPKEY_BORDER_COLORS,
	CHOICES_PNPKEY_FADE,
	CHOICES_PNPKEY_HEX,
	CHOICES_PNPKEY_SHAPES,
	CHOICES_PNPKEY_SOURCES,
	CHOICES_SWITCHES,
	CHOICES_TRANSITION_TIME_TYPES,
	CHOICES_TRANSITION_TYPES,
	CHOICES_WIPE_DIRECTIONS,
	CHOICES_WIPE_TYPES,
	hex2,
} from './constants.js'

type EmptyOptions = Record<string, never>
type CameraOptions = { useSelected: boolean; camera: string }

export type ActionsSchema = {
	run_macro: { options: { macro: number } }
	input_assign: { options: { input: number; assign: number } }
	output_assign: { options: { output: string; assign: string } }
	aux_linked_pgm_mode: { options: { mode: string } }
	aux_linked: { options: { aux: string; value: string } }
	aux_assign: { options: { aux: string; assign: string } }
	aux_mute: { options: { aux: string; mute: string } }
	pnpkey_enable: { options: { pinp: number; enable: number } }
	pnpkey_fade: { options: { pinp: string; enable: string } }
	pnpkey_busselect: { options: { pinp: string; bus: string; onoff: string } }
	pnpkey_setsource: { options: { pinp: string; source: string } }
	pnpkey_settype: { options: { pinp: string; type: string } }
	pnpkey_positionH: { options: { pinp: string; position: number } }
	pnpkey_positionV: { options: { pinp: string; position: number } }
	pnpkey_size: { options: { pinp: string; size: number } }
	pnpkey_croppingH: { options: { pinp: string; cropping: number } }
	pnpkey_croppingV: { options: { pinp: string; cropping: number } }
	pnpkey_shape: { options: { pinp: string; shape: string } }
	pnpkey_borderColor: { options: { pinp: string; color: string } }
	pnpkey_borderWidth: { options: { pinp: string; width: number } }
	pnpkey_viewPositionH: { options: { pinp: string; position: number } }
	pnpkey_viewPositionV: { options: { pinp: string; position: number } }
	pnpkey_viewZoom: { options: { pinp: string; zoom: number } }
	pnpkey_keyLevel: { options: { pinp: string; level: number } }
	pnpkey_keyGain: { options: { pinp: string; gain: number } }
	pnpkey_mixLevel: { options: { pinp: string; level: number } }
	pnpkey_chromaColor: { options: { pinp: string; color: string } }
	pnpkey_hueWidth: { options: { pinp: string; width: number } }
	pnpkey_hueFine: { options: { pinp: string; fine: number } }
	pnpkey_saturationWidth: { options: { pinp: string; width: number } }
	pnpkey_saturationFine: { options: { pinp: string; fine: number } }
	pnpkey_borderColorRed: { options: { pinp: string; red: number } }
	pnpkey_borderColorGreen: { options: { pinp: string; green: number } }
	pnpkey_borderColorBlue: { options: { pinp: string; blue: number } }
	dsk_busselect: { options: { dsk: string; bus: string; onoff: string } }
	set_transition_time: { options: { type: string; time: number } }
	set_transition_type: { options: { type: number } }
	set_mix_type: { options: { type: number } }
	set_wipe_type: { options: { type: number } }
	set_wipe_direction: { options: { direction: number } }
	press_and_release_switch: { options: { switch: string } }
	press_switch: { options: { switch: string } }
	release_switch: { options: { switch: string } }
	set_pinp_source: { options: { pinp: number; assign: number } }
	set_pinp_type: { options: { pinp: number; key: number } }
	set_dsk_key_source: { options: { dsk: number; assign: number } }
	set_dsk_fill_source: { options: { dsk: number; assign: number } }
	set_dsk_type: { options: { dsk: number; key: number } }
	select_pgm: { options: { input: string } }
	select_pvw: { options: { input: string } }
	load_memory_trigger: { options: { memory: number } }
	save_memory_trigger: { options: { memory: number } }
	initialize_memory_trigger: { options: { memory: number } }
	freezeSwitchOn: { options: EmptyOptions }
	freezeSwitchOff: { options: EmptyOptions }
	freezeSwitchType: { options: { type: string } }
	freezeSwitchSelectEnableDisable: { options: { input: string; enable: string } }
	selectCamera: { options: { camera: string } }
	cameraCurrentPreset: { options: CameraOptions & { preset: string } }
	cameraPanLeft: { options: CameraOptions }
	cameraPanRight: { options: CameraOptions }
	cameraPanStop: { options: CameraOptions }
	cameraTiltUp: { options: CameraOptions }
	cameraTiltDown: { options: CameraOptions }
	cameraTiltStop: { options: CameraOptions }
	cameraPTSpeed: { options: CameraOptions & { speed: number } }
	cameraZoomInFast: { options: CameraOptions }
	cameraZoomInSlow: { options: CameraOptions }
	cameraZoomOutFast: { options: CameraOptions }
	cameraZoomOutSlow: { options: CameraOptions }
	cameraZoomStop: { options: CameraOptions }
	focus: { options: CameraOptions & { focus: string } }
	autoFocusOn: { options: CameraOptions }
	autoFocusOff: { options: CameraOptions }
	cameraExposure: { options: CameraOptions & { exposure: string } }
	cameraSetTallyChannel: { options: CameraOptions & { channel: string } }
}

function pnpKeyField(): CompanionInputFieldDropdown<'pinp'> {
	return {
		type: 'dropdown',
		label: 'PnP/Key',
		id: 'pinp',
		default: '1B',
		choices: CHOICES_PNPKEY_HEX,
	}
}

function useSelectedCameraField(): CompanionInputFieldCheckbox<'useSelected'> {
	return {
		type: 'checkbox',
		label: 'Use Selected Camera',
		id: 'useSelected',
		default: false,
		tooltip: 'Use the camera chosen with the Select Camera action instead of the camera selected here',
		disableAutoExpression: true,
	}
}

function cameraField(): CompanionInputFieldDropdown<'camera'> {
	return {
		type: 'dropdown',
		label: 'Camera',
		id: 'camera',
		default: '41',
		choices: CHOICES_CAMERAS,
		isVisibleExpression: '!$(options:useSelected)',
	}
}

function resolveCamera(self: ModuleInstance, options: CameraOptions): string {
	return options.useSelected ? self.state.selectedCamera : options.camera
}

export function UpdateActions(self: ModuleInstance): void {
	self.setActionDefinitions({
		run_macro: {
			name: 'Run Macro',
			options: [
				{
					type: 'number',
					label: 'Macro',
					id: 'macro',
					tooltip: '(1-100)',
					min: 1,
					max: 100,
					default: 1,
					step: 1,
				},
			],
			callback: (event) => {
				sendCommand(self, '500504', hex2(event.options.macro - 1))
			},
		},

		input_assign: {
			name: 'Assign Input',
			options: [
				{
					type: 'dropdown',
					label: 'Input Channel',
					id: 'input',
					default: 0,
					choices: CHOICES_INPUTS,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: 0,
					choices: CHOICES_INPUTSASSIGN,
				},
			],
			callback: (event) => {
				sendCommand(self, '0000' + hex2(event.options.input), hex2(event.options.assign))
			},
		},

		output_assign: {
			name: 'Assign Output',
			options: [
				{
					type: 'dropdown',
					label: 'Output',
					id: 'output',
					default: '00000A',
					choices: CHOICES_OUTPUTS,
				},
				{
					type: 'dropdown',
					label: 'Type',
					id: 'assign',
					default: '00',
					choices: CHOICES_OUTPUTSASSIGN,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.output, event.options.assign)
			},
		},

		aux_linked_pgm_mode: {
			name: 'Aux Linked PGM Mode',
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: '00',
					choices: CHOICES_AUX_LINK_MODES,
				},
			],
			callback: (event) => {
				sendCommand(self, '02010D', event.options.mode)
			},
		},

		aux_linked: {
			name: 'Aux Linked',
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: '020154',
					choices: CHOICES_AUX_LINK_ADDRESSES,
				},
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'value',
					default: '00',
					choices: CHOICES_ONOFF,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.aux, event.options.value)
			},
		},

		aux_assign: {
			name: 'Assign Aux',
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: '000011',
					choices: CHOICES_AUX_SOURCE_ADDRESSES,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: '20',
					choices: CHOICES_PGMPVW_SELECT,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.aux, event.options.assign)
			},
		},

		aux_mute: {
			name: 'Mute Aux',
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: '012203',
					choices: CHOICES_AUX_MUTE_ADDRESSES,
				},
				{
					type: 'dropdown',
					label: 'Mute/Unmute',
					id: 'mute',
					default: '01',
					choices: [
						{ id: '00', label: 'Unmute' },
						{ id: '01', label: 'Mute' },
					],
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.aux, event.options.mute)
			},
		},

		pnpkey_enable: {
			name: 'PnP & Key Enable/Disable',
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: 18,
					choices: CHOICES_PINPDSK,
				},
				{
					type: 'dropdown',
					label: 'Enable/Disable',
					id: 'enable',
					default: 1,
					choices: [
						{ id: 0, label: 'Disable' },
						{ id: 1, label: 'Enable' },
					],
				},
			],
			callback: (event) => {
				sendCommand(self, '0000' + hex2(event.options.pinp), hex2(event.options.enable))
			},
		},

		pnpkey_fade: {
			name: 'PnP & Key Fade Enable/Disable',
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: '05',
					choices: CHOICES_PNPKEY_FADE,
				},
				{
					type: 'dropdown',
					label: 'Enable/Disable',
					id: 'enable',
					default: '01',
					choices: CHOICES_ENABLE,
				},
			],
			callback: (event) => {
				sendCommand(self, '0203' + event.options.pinp, event.options.enable)
			},
		},

		pnpkey_busselect: {
			name: 'PnP & Key Bus Select',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Bus',
					id: 'bus',
					default: '00',
					choices: CHOICES_BUS,
				},
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '01',
					choices: CHOICES_ONOFF,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}${event.options.bus}`, event.options.onoff)
			},
		},

		pnpkey_setsource: {
			name: 'PnP & Key Set Source',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					default: '00',
					choices: CHOICES_PNPKEY_SOURCES,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}02`, event.options.source)
			},
		},

		pnpkey_settype: {
			name: 'PnP & Key Set Type',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Type',
					id: 'type',
					default: '00',
					choices: [
						{ id: '00', label: 'PinP' },
						{ id: '01', label: 'Luminance-White Key' },
						{ id: '02', label: 'Luminance-Black Key' },
						{ id: '03', label: 'Chroma Key' },
					],
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}03`, event.options.type)
			},
		},

		pnpkey_positionH: {
			name: 'PnP & Key Position Horizontal',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Position',
					id: 'position',
					tooltip: '(-100.0 - 0.0 - 100.0)',
					min: -100,
					max: 100,
					default: 50.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.position, 10)
				sendCommand(self, `00${event.options.pinp}04`, bytes[0])
				sendCommand(self, `00${event.options.pinp}05`, bytes[1])
			},
		},

		pnpkey_positionV: {
			name: 'PnP & Key Position Vertical',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Position',
					id: 'position',
					tooltip: '(-100.0 - 0.0 - 100.0)',
					min: -100,
					max: 100,
					default: 50.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.position, 10)
				sendCommand(self, `00${event.options.pinp}06`, bytes[0])
				sendCommand(self, `00${event.options.pinp}07`, bytes[1])
			},
		},

		pnpkey_size: {
			name: 'PnP & Key Size',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Size',
					id: 'size',
					tooltip: '(10.0 - 100.0)',
					min: 10.0,
					max: 100.0,
					default: 50.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.size, 10)
				sendCommand(self, `00${event.options.pinp}08`, bytes[0])
				sendCommand(self, `00${event.options.pinp}09`, bytes[1])
			},
		},

		pnpkey_croppingH: {
			name: 'PnP & Key Cropping Horizontal',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Cropping',
					id: 'cropping',
					tooltip: '(0.0 - 100.0)',
					min: 0.0,
					max: 100.0,
					default: 0.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.cropping, 10)
				sendCommand(self, `00${event.options.pinp}0A`, bytes[0])
				sendCommand(self, `00${event.options.pinp}0B`, bytes[1])
			},
		},

		pnpkey_croppingV: {
			name: 'PnP & Key Cropping Vertical',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Cropping',
					id: 'cropping',
					tooltip: '(0.0 - 100.0)',
					min: 0.0,
					max: 100.0,
					default: 0.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.cropping, 10)
				sendCommand(self, `00${event.options.pinp}0C`, bytes[0])
				sendCommand(self, `00${event.options.pinp}0D`, bytes[1])
			},
		},

		pnpkey_shape: {
			name: 'PnP & Key Shape',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Shape',
					id: 'shape',
					default: '00',
					choices: CHOICES_PNPKEY_SHAPES,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}0E`, event.options.shape)
			},
		},

		pnpkey_borderColor: {
			name: 'PnP & Key Border Color',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Border Color',
					id: 'color',
					default: '00',
					choices: CHOICES_PNPKEY_BORDER_COLORS,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}0F`, event.options.color)
			},
		},

		pnpkey_borderWidth: {
			name: 'PnP & Key Border Width',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Border Width',
					id: 'width',
					tooltip: '0-14',
					min: 0,
					max: 14,
					default: 5,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}10`, hex2(event.options.width))
			},
		},

		pnpkey_viewPositionH: {
			name: 'PnP & Key View Position Horizontal',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Position',
					id: 'position',
					tooltip: '(-50.0 - 0.0 - 50.0)',
					min: -50.0,
					max: 50,
					default: 0.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.position, 10)
				sendCommand(self, `00${event.options.pinp}11`, bytes[0])
				sendCommand(self, `00${event.options.pinp}12`, bytes[1])
			},
		},

		pnpkey_viewPositionV: {
			name: 'PnP & Key View Position Vertical',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Position',
					id: 'position',
					tooltip: '(-50.0 - 0.0 - 50.0)',
					min: -50.0,
					max: 50,
					default: 0.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.position, 10)
				sendCommand(self, `00${event.options.pinp}13`, bytes[0])
				sendCommand(self, `00${event.options.pinp}14`, bytes[1])
			},
		},

		pnpkey_viewZoom: {
			name: 'PnP & Key View Zoom',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Zoom',
					id: 'zoom',
					tooltip: '(100% - 400%)',
					min: 100,
					max: 400,
					default: 100,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.zoom, 1)
				sendCommand(self, `00${event.options.pinp}15`, bytes[0])
				sendCommand(self, `00${event.options.pinp}16`, bytes[1])
			},
		},

		pnpkey_keyLevel: {
			name: 'PnP & Key Key Level',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Level',
					id: 'level',
					tooltip: '(0-255)',
					min: 0,
					max: 255,
					default: 50,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.level, 1)
				sendCommand(self, `00${event.options.pinp}17`, bytes[0])
				sendCommand(self, `00${event.options.pinp}18`, bytes[1])
			},
		},

		pnpkey_keyGain: {
			name: 'PnP & Key Key Gain',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Gain',
					id: 'gain',
					tooltip: '(0-255)',
					min: 0,
					max: 255,
					default: 50,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.gain, 1)
				sendCommand(self, `00${event.options.pinp}19`, bytes[0])
				sendCommand(self, `00${event.options.pinp}1A`, bytes[1])
			},
		},

		pnpkey_mixLevel: {
			name: 'PnP & Key Mix Level',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Level',
					id: 'level',
					tooltip: '(0-255)',
					min: 0,
					max: 255,
					default: 50,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.level, 1)
				sendCommand(self, `00${event.options.pinp}1B`, bytes[0])
				sendCommand(self, `00${event.options.pinp}1C`, bytes[1])
			},
		},

		pnpkey_chromaColor: {
			name: 'PnP & Key Chroma Color',
			options: [
				pnpKeyField(),
				{
					type: 'dropdown',
					label: 'Color',
					id: 'color',
					default: '00',
					choices: CHOICES_CHROMA_COLORS,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.pinp}1D`, event.options.color)
			},
		},

		pnpkey_hueWidth: {
			name: 'PnP & Key Hue Width',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Width',
					id: 'width',
					tooltip: '(-30 - 0 - +30)',
					min: -30,
					max: 30,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				// Preserved from the original module: this value is sent as a raw
				// decimal (possibly negative), unlike the other 14-bit parameters.
				sendCommand(self, `00${event.options.pinp}1E`, event.options.width)
			},
		},

		pnpkey_hueFine: {
			name: 'PnP & Key Hue Fine',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Fine',
					id: 'fine',
					tooltip: '(0 - 360)',
					min: 0,
					max: 360,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.fine, 1)
				sendCommand(self, `00${event.options.pinp}1F`, bytes[0])
				sendCommand(self, `00${event.options.pinp}20`, bytes[1])
			},
		},

		pnpkey_saturationWidth: {
			name: 'PnP & Key Saturation Width',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Width',
					id: 'width',
					tooltip: '(-127 - 0 - +127)',
					min: -127,
					max: 127,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.width, 1)
				sendCommand(self, `00${event.options.pinp}21`, bytes[0])
				sendCommand(self, `00${event.options.pinp}22`, bytes[1])
			},
		},

		pnpkey_saturationFine: {
			name: 'PnP & Key Saturation Fine',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Fine',
					id: 'fine',
					tooltip: '(0 - 255)',
					min: 0,
					max: 255,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.fine, 1)
				sendCommand(self, `00${event.options.pinp}23`, bytes[0])
				sendCommand(self, `00${event.options.pinp}24`, bytes[1])
			},
		},

		pnpkey_borderColorRed: {
			name: 'PnP & Key Border Color Red',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Red',
					id: 'red',
					tooltip: '(0 - 255)',
					min: 0,
					max: 255,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.red, 1)
				sendCommand(self, `00${event.options.pinp}25`, bytes[0])
				sendCommand(self, `00${event.options.pinp}26`, bytes[1])
			},
		},

		pnpkey_borderColorGreen: {
			name: 'PnP & Key Border Color Green',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Green',
					id: 'green',
					tooltip: '(0 - 255)',
					min: 0,
					max: 255,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.green, 1)
				sendCommand(self, `00${event.options.pinp}27`, bytes[0])
				sendCommand(self, `00${event.options.pinp}28`, bytes[1])
			},
		},

		pnpkey_borderColorBlue: {
			name: 'PnP & Key Border Color Blue',
			options: [
				pnpKeyField(),
				{
					type: 'number',
					label: 'Blue',
					id: 'blue',
					tooltip: '(0 - 255)',
					min: 0,
					max: 255,
					default: 0,
					step: 1,
					range: true,
				},
			],
			callback: (event) => {
				const bytes = calculateBytes(event.options.blue, 1)
				sendCommand(self, `00${event.options.pinp}29`, bytes[0])
				sendCommand(self, `00${event.options.pinp}2A`, bytes[1])
			},
		},

		dsk_busselect: {
			name: 'DSK Bus Select',
			options: [
				{
					type: 'dropdown',
					label: 'DSK',
					id: 'dsk',
					default: '1F',
					choices: CHOICES_DSK_HEX,
				},
				{
					type: 'dropdown',
					label: 'Bus',
					id: 'bus',
					default: '00',
					choices: CHOICES_BUS,
				},
				{
					type: 'dropdown',
					label: 'On/Off',
					id: 'onoff',
					default: '01',
					choices: CHOICES_ONOFF,
				},
			],
			callback: (event) => {
				sendCommand(self, `00${event.options.dsk}${event.options.bus}`, event.options.onoff)
			},
		},

		set_transition_time: {
			name: 'Set Transition Time',
			options: [
				{
					type: 'dropdown',
					label: 'Transition Type',
					id: 'type',
					default: '001700',
					choices: CHOICES_TRANSITION_TIME_TYPES,
				},
				{
					type: 'number',
					label: 'Transition Time',
					id: 'time',
					tooltip: '(0.0-4.0)',
					min: 0.0,
					max: 4.0,
					default: 1.0,
					step: 0.1,
					range: true,
				},
			],
			callback: (event) => {
				// Math.round guards against float error (e.g. 2.3 * 10 = 22.999...),
				// which in the original module produced a garbage hex value
				sendCommand(self, event.options.type, hex2(Math.round(event.options.time * 10)))
			},
		},

		set_transition_type: {
			name: 'Set Transition Type',
			options: [
				{
					type: 'dropdown',
					label: 'Transition Type',
					id: 'type',
					default: 0,
					choices: CHOICES_TRANSITION_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '001800', hex2(event.options.type))
			},
		},

		set_mix_type: {
			name: 'Set Mix Type',
			options: [
				{
					type: 'dropdown',
					label: 'Mix Type',
					id: 'type',
					default: 0,
					choices: CHOICES_MIX_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '001801', hex2(event.options.type))
			},
		},

		set_wipe_type: {
			name: 'Set Wipe Type',
			options: [
				{
					type: 'dropdown',
					label: 'Wipe Type',
					id: 'type',
					default: 0,
					choices: CHOICES_WIPE_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '001802', hex2(event.options.type))
			},
		},

		set_wipe_direction: {
			name: 'Set Wipe Direction',
			options: [
				{
					type: 'dropdown',
					label: 'Wipe Direction',
					id: 'direction',
					default: 0,
					choices: CHOICES_WIPE_DIRECTIONS,
				},
			],
			callback: (event) => {
				// The original module read the non-existent option 'type' here and crashed
				sendCommand(self, '001803', hex2(event.options.direction))
			},
		},

		press_and_release_switch: {
			name: 'Press and Release Panel Switch',
			options: [
				{
					type: 'dropdown',
					label: 'Switch',
					id: 'switch',
					default: '0B0000',
					choices: CHOICES_SWITCHES,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.switch, '01')
				const timer = setTimeout(() => {
					self.pressTimers.delete(timer)
					sendCommand(self, event.options.switch, '00')
				}, 200)
				self.pressTimers.add(timer)
			},
		},

		press_switch: {
			name: "Press Panel Switch (Don't Release)",
			options: [
				{
					type: 'dropdown',
					label: 'Switch',
					id: 'switch',
					default: '0B0000',
					choices: CHOICES_SWITCHES,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.switch, '01')
			},
		},

		release_switch: {
			name: 'Release Panel Switch',
			options: [
				{
					type: 'dropdown',
					label: 'Switch',
					id: 'switch',
					default: '0B0000',
					choices: CHOICES_SWITCHES,
				},
			],
			callback: (event) => {
				sendCommand(self, event.options.switch, '00')
			},
		},

		set_pinp_source: {
			name: 'Set PnP & Key Source',
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: 27,
					choices: CHOICES_PINP_KEYS,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: 0,
					choices: CHOICES_INPUTSASSIGN,
				},
			],
			callback: (event) => {
				sendCommand(self, '00' + hex2(event.options.pinp) + '02', hex2(event.options.assign))
			},
		},

		set_pinp_type: {
			name: 'Set PnP & Key Type',
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: 27,
					choices: CHOICES_PINP_KEYS,
				},
				{
					type: 'dropdown',
					label: 'Key Type',
					id: 'key',
					default: 0,
					choices: CHOICES_PINP_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '00' + hex2(event.options.pinp) + '03', hex2(event.options.key))
			},
		},

		set_dsk_key_source: {
			name: 'Set DSK Key Source',
			options: [
				{
					type: 'dropdown',
					label: 'DSK',
					id: 'dsk',
					default: 31,
					choices: CHOICES_DSK,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: 0,
					choices: CHOICES_INPUTSASSIGN,
				},
			],
			callback: (event) => {
				sendCommand(self, '00' + hex2(event.options.dsk) + '03', hex2(event.options.assign))
			},
		},

		set_dsk_fill_source: {
			name: 'Set DSK Fill Source',
			options: [
				{
					type: 'dropdown',
					label: 'DSK',
					id: 'dsk',
					default: 31,
					choices: CHOICES_DSK,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: 0,
					choices: CHOICES_INPUTSASSIGN,
				},
			],
			callback: (event) => {
				sendCommand(self, '00' + hex2(event.options.dsk) + '04', hex2(event.options.assign))
			},
		},

		set_dsk_type: {
			name: 'Set DSK Key Type',
			options: [
				{
					type: 'dropdown',
					label: 'DSK',
					id: 'dsk',
					default: 31,
					choices: CHOICES_DSK,
				},
				{
					type: 'dropdown',
					label: 'Key Type',
					id: 'key',
					default: 0,
					choices: CHOICES_DSK_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '00' + hex2(event.options.dsk) + '05', hex2(event.options.key))
			},
		},

		select_pgm: {
			name: 'Select PGM Source',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '20',
					choices: CHOICES_PGMPVW_SELECT,
				},
			],
			callback: (event) => {
				sendCommand(self, '002100', event.options.input)
			},
		},

		select_pvw: {
			name: 'Select PVW Source',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '20',
					choices: CHOICES_PGMPVW_SELECT,
				},
			],
			callback: (event) => {
				sendCommand(self, '002101', event.options.input)
			},
		},

		load_memory_trigger: {
			name: 'Load Memory Trigger',
			options: [
				{
					type: 'dropdown',
					label: 'Memory',
					id: 'memory',
					default: 0,
					choices: CHOICES_MEMORY,
				},
			],
			callback: (event) => {
				sendCommand(self, '0A0000', hex2(event.options.memory))
			},
		},

		save_memory_trigger: {
			name: 'Save Memory Trigger',
			options: [
				{
					type: 'dropdown',
					label: 'Memory',
					id: 'memory',
					default: 0,
					choices: CHOICES_MEMORY,
				},
			],
			callback: (event) => {
				sendCommand(self, '0A0001', hex2(event.options.memory))
			},
		},

		initialize_memory_trigger: {
			name: 'Initialize Memory Trigger',
			options: [
				{
					type: 'dropdown',
					label: 'Memory',
					id: 'memory',
					default: 0,
					choices: CHOICES_MEMORY,
				},
			],
			callback: (event) => {
				sendCommand(self, '0A0002', hex2(event.options.memory))
			},
		},

		freezeSwitchOn: {
			name: 'Freeze Switch On',
			options: [],
			callback: () => {
				sendCommand(self, '020500', '01')
			},
		},

		freezeSwitchOff: {
			name: 'Freeze Switch Off',
			options: [],
			callback: () => {
				sendCommand(self, '020500', '00')
			},
		},

		freezeSwitchType: {
			name: 'Freeze Switch Type',
			options: [
				{
					type: 'dropdown',
					label: 'Type',
					id: 'type',
					default: '00',
					choices: CHOICES_FREEZE_TYPES,
				},
			],
			callback: (event) => {
				sendCommand(self, '020501', event.options.type)
			},
		},

		freezeSwitchSelectEnableDisable: {
			name: 'Freeze Switch Select Enable/Disable',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'input',
					default: '02',
					choices: CHOICES_FREEZE_INPUTS,
				},
				{
					type: 'dropdown',
					label: 'Enable/Disable',
					id: 'enable',
					default: '01',
					choices: CHOICES_ENABLE,
				},
			],
			callback: (event) => {
				sendCommand(self, '0205' + event.options.input, event.options.enable)
			},
		},

		selectCamera: {
			name: 'Select Camera',
			options: [
				{
					type: 'dropdown',
					label: 'Camera',
					id: 'camera',
					default: '41',
					choices: CHOICES_CAMERAS,
				},
			],
			callback: (event) => {
				self.state.selectedCamera = event.options.camera
				self.checkFeedbacks('selectedCamera')
			},
		},

		cameraCurrentPreset: {
			name: 'Camera Current Preset',
			options: [
				useSelectedCameraField(),
				cameraField(),
				{
					type: 'dropdown',
					label: 'Preset',
					id: 'preset',
					default: '00',
					choices: CHOICES_CAMERA_PRESETS,
				},
			],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}21`, event.options.preset)
			},
		},

		cameraPanLeft: {
			name: 'Camera Pan Left',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}22`, '7F')
			},
		},

		cameraPanRight: {
			name: 'Camera Pan Right',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}22`, '01')
			},
		},

		cameraPanStop: {
			name: 'Camera Pan Stop',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}22`, '00')
			},
		},

		cameraTiltUp: {
			name: 'Camera Tilt Up',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}23`, '01')
			},
		},

		cameraTiltDown: {
			name: 'Camera Tilt Down',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}23`, '7F')
			},
		},

		cameraTiltStop: {
			name: 'Camera Tilt Stop',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}23`, '00')
			},
		},

		cameraPTSpeed: {
			name: 'Camera Pan/Tilt Speed',
			options: [
				useSelectedCameraField(),
				cameraField(),
				{
					type: 'number',
					label: 'Speed',
					id: 'speed',
					tooltip: '(0-24)',
					min: 0,
					max: 24,
					default: 10,
					step: 1,
				},
			],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}24`, hex2(event.options.speed))
			},
		},

		cameraZoomInFast: {
			name: 'Camera Zoom In Fast',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}25`, '02')
			},
		},

		cameraZoomInSlow: {
			name: 'Camera Zoom In Slow',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}25`, '01')
			},
		},

		cameraZoomOutFast: {
			name: 'Camera Zoom Out Fast',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}25`, '7E')
			},
		},

		cameraZoomOutSlow: {
			name: 'Camera Zoom Out Slow',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}25`, '7F')
			},
		},

		cameraZoomStop: {
			name: 'Camera Zoom Stop',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}25`, '00')
			},
		},

		focus: {
			name: 'Camera Focus',
			options: [
				useSelectedCameraField(),
				cameraField(),
				{
					type: 'dropdown',
					label: 'Focus',
					id: 'focus',
					default: '7F',
					choices: CHOICES_FOCUS,
				},
			],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}26`, event.options.focus)
			},
		},

		autoFocusOn: {
			name: 'Camera Auto Focus - On',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}27`, '01')
			},
		},

		autoFocusOff: {
			name: 'Camera Auto Focus - Off',
			options: [useSelectedCameraField(), cameraField()],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}27`, '00')
			},
		},

		cameraExposure: {
			name: 'Camera Exposure',
			options: [
				useSelectedCameraField(),
				cameraField(),
				{
					type: 'dropdown',
					label: 'Exposure',
					id: 'exposure',
					default: '00',
					choices: CHOICES_EXPOSURE,
				},
			],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}28`, event.options.exposure)
			},
		},

		cameraSetTallyChannel: {
			name: 'Camera Set Tally Channel',
			options: [
				useSelectedCameraField(),
				cameraField(),
				{
					type: 'dropdown',
					label: 'Input for Tally',
					id: 'channel',
					default: '00',
					choices: CHOICES_CAMERA_TALLY_INPUTS,
				},
			],
			callback: (event) => {
				sendCommand(self, `02${resolveCamera(self, event.options)}29`, event.options.channel)
			},
		},
	})
}
