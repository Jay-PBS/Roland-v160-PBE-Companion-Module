import { combineRgb } from '@companion-module/base'
import type ModuleInstance from './main.js'
import {
	CHOICES_AUX_KEYS,
	CHOICES_AUX_LINK_MODES,
	CHOICES_BUS,
	CHOICES_CAMERAS,
	CHOICES_MEMORY,
	CHOICES_ONOFF,
	CHOICES_OUTPUTS,
	CHOICES_OUTPUTSASSIGN,
	CHOICES_PGMPVW_SELECT,
	CHOICES_PNPKEY_HEX,
	CHOICES_PNPKEY_SOURCES,
	TALLY_INPUTS,
} from './constants.js'

export type FeedbacksSchema = {
	tally: { type: 'boolean'; options: { input: number; state: string } }
	auxTally: { type: 'boolean'; options: { aux: string; assign: string } }
	auxMute: { type: 'boolean'; options: { aux: string; mute: string } }
	outputAssign: { type: 'boolean'; options: { output: string; assign: string } }
	auxLinkMode: { type: 'boolean'; options: { mode: string } }
	auxLink: { type: 'boolean'; options: { aux: string; link: string } }
	keyOnAir: { type: 'boolean'; options: { pinp: string; bus: string; onoff: string } }
	freeze: { type: 'boolean'; options: Record<string, never> }
	pnpKeySource: { type: 'boolean'; options: { pinp: string; source: string } }
	selectedCamera: { type: 'boolean'; options: { camera: string } }
	lastMemory: { type: 'boolean'; options: { memory: number } }
}

const WHITE = combineRgb(255, 255, 255)
const RED = combineRgb(255, 0, 0)

function auxStateValue(self: ModuleInstance, aux: string, kind: 'source' | 'mute' | 'link'): string | undefined {
	const state = self.state
	switch (aux) {
		case 'aux1':
			return kind === 'source' ? state.aux1source : kind === 'mute' ? state.aux1mute : state.aux1link
		case 'aux2':
			return kind === 'source' ? state.aux2source : kind === 'mute' ? state.aux2mute : state.aux2link
		case 'aux3':
			return kind === 'source' ? state.aux3source : kind === 'mute' ? state.aux3mute : state.aux3link
		default:
			return undefined
	}
}

export function UpdateFeedbacks(self: ModuleInstance): void {
	self.setFeedbackDefinitions({
		tally: {
			type: 'boolean',
			name: 'Tally State',
			description: 'Indicate if Input Channel is in Preview or Program',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Input Channel',
					id: 'input',
					default: 0,
					choices: TALLY_INPUTS.map((t) => ({ id: t.id, label: t.label })),
				},
				{
					type: 'dropdown',
					label: 'Indicate in X State',
					id: 'state',
					default: 'program',
					choices: [
						{ id: 'program', label: 'Program (A)' },
						{ id: 'preview', label: 'Preview (B)' },
						{ id: 'both', label: 'Both' },
					],
				},
			],
			callback: (feedback) => {
				// Status 3 is 'on PGM and PVW at once', so it has to satisfy the
				// Program and Preview selections as well as Both. The original module
				// matched it only against Both, which left a Program tally button dark
				// precisely when its input was on programme.
				const status = self.state.tally.get(feedback.options.input) ?? 0
				switch (feedback.options.state) {
					case 'program':
						return status === 1 || status === 3
					case 'preview':
						return status === 2 || status === 3
					case 'both':
						return status === 3
					default:
						return false
				}
			},
		},

		auxTally: {
			type: 'boolean',
			name: 'Aux Tally State',
			description: 'Indicate if Input Channel is in an Auxiliary Channel',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: 'aux1',
					choices: CHOICES_AUX_KEYS,
				},
				{
					type: 'dropdown',
					label: 'Input Type',
					id: 'assign',
					default: '20',
					choices: CHOICES_PGMPVW_SELECT,
				},
			],
			callback: (feedback) => {
				return auxStateValue(self, feedback.options.aux, 'source') === feedback.options.assign
			},
		},

		auxMute: {
			type: 'boolean',
			name: 'Aux Mute State',
			description: 'Indicate if Aux Channel is Muted',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: 'aux1',
					choices: CHOICES_AUX_KEYS,
				},
				{
					type: 'dropdown',
					label: 'Mute State',
					id: 'mute',
					default: '01',
					choices: CHOICES_ONOFF,
				},
			],
			callback: (feedback) => {
				return auxStateValue(self, feedback.options.aux, 'mute') === feedback.options.mute
			},
		},

		outputAssign: {
			type: 'boolean',
			name: 'Output Assign State',
			description: 'Indicate if Output is Assigned to a specific Source',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
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
			callback: (feedback) => {
				const state = self.state
				const current = {
					'00000A': state.hdmi1assign,
					'00000B': state.hdmi2assign,
					'00000C': state.hdmi3assign,
					'00000D': state.sdi1assign,
					'00000E': state.sdi2assign,
					'00000F': state.sdi3assign,
					'000010': state.usbassign,
					'000110': state.usbassign,
				}[feedback.options.output]
				return current !== undefined && current === feedback.options.assign
			},
		},

		auxLinkMode: {
			type: 'boolean',
			name: 'Aux Link Mode',
			description: 'Indicate if Aux Link Mode is Off, Auto Link, or Manual Link',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Mode',
					id: 'mode',
					default: '00',
					choices: CHOICES_AUX_LINK_MODES,
				},
			],
			callback: (feedback) => {
				return self.state.auxlinkmode === feedback.options.mode
			},
		},

		auxLink: {
			type: 'boolean',
			name: 'Aux Link State',
			description: 'Indicate if Aux Channel is Linked to PGM',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Aux',
					id: 'aux',
					default: 'aux1',
					choices: CHOICES_AUX_KEYS,
				},
				{
					type: 'dropdown',
					label: 'Link Mode',
					id: 'link',
					default: '01',
					choices: CHOICES_ONOFF,
				},
			],
			callback: (feedback) => {
				return auxStateValue(self, feedback.options.aux, 'link') === feedback.options.link
			},
		},

		keyOnAir: {
			type: 'boolean',
			name: 'Key is Selected on Bus',
			description: 'Indicate if PnP/Key or DSK is Selected on Bus',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: '1B',
					choices: CHOICES_PNPKEY_HEX,
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
			callback: (feedback) => {
				// The original module tried to .find() on a plain object here and
				// read a non-existent option, so this feedback never worked
				const value = self.state.values.get(`${feedback.options.pinp}${feedback.options.bus}`)
				return value !== undefined && value === feedback.options.onoff
			},
		},

		freeze: {
			type: 'boolean',
			name: 'Freeze State',
			description: 'Indicate if Freeze is On or Off',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [],
			callback: () => {
				return self.state.freeze === '01'
			},
		},

		pnpKeySource: {
			type: 'boolean',
			name: 'PnP/Key Source State',
			description: 'Indicate if PnP/Key Source is Selected on PnP/Key',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'PnP/Key',
					id: 'pinp',
					default: 'pnpkey1',
					choices: [
						{ id: 'pnpkey1', label: 'PnP/Key 1' },
						{ id: 'pnpkey2', label: 'PnP/Key 2' },
						{ id: 'pnpkey3', label: 'PnP/Key 3' },
						{ id: 'pnpkey4', label: 'PnP/Key 4' },
					],
				},
				{
					type: 'dropdown',
					label: 'Source',
					id: 'source',
					default: '00',
					choices: CHOICES_PNPKEY_SOURCES,
				},
			],
			callback: (feedback) => {
				const keyNumber = parseInt(feedback.options.pinp.replace('pnpkey', ''), 10)
				return self.state.pnpkeySource.get(keyNumber) === feedback.options.source
			},
		},

		selectedCamera: {
			type: 'boolean',
			name: 'Camera is Selected',
			description: 'Indicate if a Camera is the currently selected camera for camera control actions',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Camera',
					id: 'camera',
					default: '41',
					choices: CHOICES_CAMERAS,
				},
			],
			callback: (feedback) => {
				return self.state.selectedCamera === feedback.options.camera
			},
		},

		lastMemory: {
			type: 'boolean',
			name: 'Memory was Last Loaded',
			description: 'Indicate if a Memory is the most recently loaded memory',
			defaultStyle: {
				color: WHITE,
				bgcolor: RED,
			},
			options: [
				{
					type: 'dropdown',
					label: 'Memory',
					id: 'memory',
					default: 0,
					choices: CHOICES_MEMORY,
				},
			],
			callback: (feedback) => {
				return self.state.lastMemory !== undefined && self.state.lastMemory === feedback.options.memory
			},
		},
	})
}
