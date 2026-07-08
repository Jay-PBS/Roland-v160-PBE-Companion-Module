import {
	combineRgb,
	type CompanionButtonStyleProps,
	type CompanionPresetDefinitions,
	type CompanionPresetGroupSimple,
	type CompanionPresetSection,
	type SomePresetActionEntry,
	type SomePresetSimpleFeedbackEntry,
} from '@companion-module/base'
import type ModuleInstance from './main.js'
import type { ModuleSchema } from './main.js'
import {
	CHOICES_AUX_LINK_ADDRESSES,
	CHOICES_AUX_LINK_MODES,
	CHOICES_AUX_MUTE_ADDRESSES,
	CHOICES_AUX_SOURCE_ADDRESSES,
	CHOICES_CAMERAS,
	CHOICES_CAMERA_PRESETS,
	CHOICES_CAMERA_TALLY_INPUTS,
	CHOICES_CHROMA_COLORS,
	CHOICES_DSK,
	CHOICES_DSK_HEX,
	CHOICES_DSK_TYPES,
	CHOICES_FREEZE_INPUTS,
	CHOICES_FREEZE_TYPES,
	CHOICES_INPUTS,
	CHOICES_INPUTSASSIGN,
	CHOICES_MEMORY,
	CHOICES_MIX_TYPES,
	CHOICES_OUTPUTS,
	CHOICES_OUTPUTSASSIGN,
	CHOICES_PGMPVW_SELECT,
	CHOICES_PINPDSK,
	CHOICES_PINP_KEYS,
	CHOICES_PNPKEY_BORDER_COLORS,
	CHOICES_PNPKEY_FADE,
	CHOICES_PNPKEY_HEX,
	CHOICES_PNPKEY_SOURCES,
	CHOICES_SWITCHES,
	CHOICES_TRANSITION_TIME_TYPES,
	CHOICES_TRANSITION_TYPES,
	CHOICES_WIPE_DIRECTIONS,
	CHOICES_WIPE_TYPES,
	SWITCH_AUTO,
	SWITCH_CUT,
} from './constants.js'

/**
 * Preset variable references use the module id; Companion substitutes the
 * user's actual connection label at render time.
 */
const VAR = 'roland-v160v1-pbs'

const WHITE = combineRgb(255, 255, 255)

/** Role-based colour palette — change a role here and every preset follows. */
const PALETTE = {
	program: combineRgb(96, 12, 12),
	programActive: combineRgb(255, 0, 0),
	preview: combineRgb(12, 84, 12),
	previewActive: combineRgb(0, 200, 0),
	transition: combineRgb(140, 90, 0),
	layer: combineRgb(75, 0, 130),
	layerActive: combineRgb(190, 0, 255),
	aux: combineRgb(0, 64, 128),
	auxActive: combineRgb(0, 150, 255),
	routing: combineRgb(0, 96, 96),
	routingActive: combineRgb(0, 190, 190),
	memory: combineRgb(90, 0, 90),
	memoryActive: combineRgb(210, 0, 210),
	freeze: combineRgb(96, 96, 0),
	freezeActive: combineRgb(220, 220, 0),
	camera: combineRgb(47, 79, 79),
	cameraActive: combineRgb(0, 160, 160),
	panel: combineRgb(48, 48, 48),
	system: combineRgb(24, 24, 24),
}

type Group = CompanionPresetGroupSimple<ModuleSchema>
type ActionEntry = SomePresetActionEntry<ModuleSchema>
type FeedbackEntry = SomePresetSimpleFeedbackEntry<ModuleSchema>

function style(text: string, bgcolor: number): CompanionButtonStyleProps {
	return { text, size: 'auto', color: WHITE, bgcolor, show_topbar: false }
}

export function UpdatePresets(self: ModuleInstance): void {
	const presets: CompanionPresetDefinitions<ModuleSchema> = {}
	const structure: CompanionPresetSection<ModuleSchema>[] = []

	function section(id: string, name: string, description?: string): Group[] {
		const groups: Group[] = []
		structure.push({ id, name, description, definitions: groups })
		return groups
	}

	function group(groups: Group[], id: string, name: string): Group {
		const g: Group = { id, name, type: 'simple', presets: [] }
		groups.push(g)
		return g
	}

	function button(
		g: Group,
		id: string,
		name: string,
		text: string,
		bgcolor: number,
		down: ActionEntry[],
		feedbacks: FeedbackEntry[] = [],
	): void {
		presets[id] = {
			type: 'simple',
			name,
			style: style(text, bgcolor),
			steps: [{ down, up: [] }],
			feedbacks,
		}
		g.presets.push(id)
	}

	// ---------------------------------------------------------------- Program

	const programGroups = section('program', 'Program', 'Select the Program (PGM/A) bus source')
	const pgmGroup = group(programGroups, 'program-source', 'Program Source')
	for (const source of CHOICES_PGMPVW_SELECT) {
		const sourceId = String(source.id)
		const tallyId = parseInt(sourceId, 16)
		const feedbacks: FeedbackEntry[] =
			tallyId <= 0x1f
				? [
						{
							feedbackId: 'tally',
							options: { input: tallyId, state: 'program' },
							style: { bgcolor: PALETTE.programActive, color: WHITE },
						},
					]
				: []
		button(
			pgmGroup,
			`pgm_${sourceId}`,
			`PGM ${source.label}`,
			`PGM\n${source.label}`,
			PALETTE.program,
			[{ actionId: 'select_pgm', options: { input: sourceId } }],
			feedbacks,
		)
	}

	// ---------------------------------------------------------------- Preview

	const previewGroups = section('preview', 'Preview', 'Select the Preview (PVW/B) bus source')
	const pvwGroup = group(previewGroups, 'preview-source', 'Preview Source')
	for (const source of CHOICES_PGMPVW_SELECT) {
		const sourceId = String(source.id)
		const tallyId = parseInt(sourceId, 16)
		const feedbacks: FeedbackEntry[] =
			tallyId <= 0x1f
				? [
						{
							feedbackId: 'tally',
							options: { input: tallyId, state: 'preview' },
							style: { bgcolor: PALETTE.previewActive, color: WHITE },
						},
					]
				: []
		button(
			pvwGroup,
			`pvw_${sourceId}`,
			`PVW ${source.label}`,
			`PVW\n${source.label}`,
			PALETTE.preview,
			[{ actionId: 'select_pvw', options: { input: sourceId } }],
			feedbacks,
		)
	}

	// ------------------------------------------------------------ Transitions

	const transitionGroups = section('transitions', 'Transitions', 'Cut, auto and transition setup')

	const takeGroup = group(transitionGroups, 'transition-take', 'Cut & Auto')
	button(takeGroup, 'take_cut', 'Cut', 'CUT', PALETTE.transition, [
		{ actionId: 'press_and_release_switch', options: { switch: SWITCH_CUT } },
	])
	button(takeGroup, 'take_auto', 'Auto', 'AUTO', PALETTE.transition, [
		{ actionId: 'press_and_release_switch', options: { switch: SWITCH_AUTO } },
	])

	const transTypeGroup = group(transitionGroups, 'transition-type', 'Transition Type')
	for (const type of CHOICES_TRANSITION_TYPES) {
		button(
			transTypeGroup,
			`trans_type_${type.id}`,
			`Transition Type ${type.label}`,
			`TRANS\n${type.label}`,
			PALETTE.transition,
			[{ actionId: 'set_transition_type', options: { type: Number(type.id) } }],
		)
	}

	const mixTypeGroup = group(transitionGroups, 'mix-type', 'Mix Type')
	for (const type of CHOICES_MIX_TYPES) {
		button(mixTypeGroup, `mix_type_${type.id}`, `Mix Type ${type.label}`, `MIX\n${type.label}`, PALETTE.transition, [
			{ actionId: 'set_mix_type', options: { type: Number(type.id) } },
		])
	}

	const wipeTypeGroup = group(transitionGroups, 'wipe-type', 'Wipe Type')
	for (const type of CHOICES_WIPE_TYPES) {
		button(
			wipeTypeGroup,
			`wipe_type_${type.id}`,
			`Wipe Type ${type.label}`,
			`WIPE\n${type.label}`,
			PALETTE.transition,
			[{ actionId: 'set_wipe_type', options: { type: Number(type.id) } }],
		)
	}

	const wipeDirGroup = group(transitionGroups, 'wipe-direction', 'Wipe Direction')
	for (const dir of CHOICES_WIPE_DIRECTIONS) {
		button(
			wipeDirGroup,
			`wipe_dir_${dir.id}`,
			`Wipe Direction ${dir.label}`,
			`WIPE DIR\n${dir.label}`,
			PALETTE.transition,
			[{ actionId: 'set_wipe_direction', options: { direction: Number(dir.id) } }],
		)
	}

	const transTimeGroup = group(transitionGroups, 'transition-time', 'Transition Time')
	for (const target of CHOICES_TRANSITION_TIME_TYPES) {
		button(
			transTimeGroup,
			`trans_time_${target.id}`,
			`${target.label} 1.0s`,
			`${target.label}\n1.0s`,
			PALETTE.transition,
			[{ actionId: 'set_transition_time', options: { type: String(target.id), time: 1.0 } }],
		)
	}

	// -------------------------------------------------------- Layers (on-air)

	const layerGroups = section('layers', 'Layers On-Air', 'PinP & Key / DSK bus selection and layer enables')

	for (const bus of ['00', '01'] as const) {
		const busName = bus === '00' ? 'PGM' : 'PVW'
		const busColorActive = bus === '00' ? PALETTE.programActive : PALETTE.previewActive
		const g = group(layerGroups, `pinp-bus-${bus}`, `PinP & Key on ${busName}`)
		for (const key of CHOICES_PNPKEY_HEX) {
			const keyId = String(key.id)
			for (const onoff of ['01', '00'] as const) {
				button(
					g,
					`pinp_bus_${keyId}_${bus}_${onoff}`,
					`${key.label} ${busName} ${onoff === '01' ? 'On' : 'Off'}`,
					`${key.label}\n${busName} ${onoff === '01' ? 'ON' : 'OFF'}`,
					PALETTE.layer,
					[{ actionId: 'pnpkey_busselect', options: { pinp: keyId, bus, onoff } }],
					[
						{
							feedbackId: 'keyOnAir',
							options: { pinp: keyId, bus, onoff: '01' },
							style: { bgcolor: busColorActive, color: WHITE },
						},
					],
				)
			}
		}
	}

	const dskBusGroup = group(layerGroups, 'dsk-bus', 'DSK on Bus')
	for (const dsk of CHOICES_DSK_HEX) {
		const dskId = String(dsk.id)
		for (const bus of ['00', '01'] as const) {
			const busName = bus === '00' ? 'PGM' : 'PVW'
			for (const onoff of ['01', '00'] as const) {
				button(
					dskBusGroup,
					`dsk_bus_${dskId}_${bus}_${onoff}`,
					`${dsk.label} ${busName} ${onoff === '01' ? 'On' : 'Off'}`,
					`${dsk.label}\n${busName} ${onoff === '01' ? 'ON' : 'OFF'}`,
					PALETTE.layer,
					[{ actionId: 'dsk_busselect', options: { dsk: dskId, bus, onoff } }],
				)
			}
		}
	}

	const layerEnableGroup = group(layerGroups, 'layer-enable', 'Layer Enable/Disable')
	for (const layer of CHOICES_PINPDSK) {
		const layerId = Number(layer.id)
		for (const enable of [1, 0]) {
			button(
				layerEnableGroup,
				`layer_enable_${layerId}_${enable}`,
				`${layer.label} ${enable ? 'Enable' : 'Disable'}`,
				`${layer.label.replace('Program Layer', 'PGM')}\n${enable ? 'ENABLE' : 'DISABLE'}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_enable', options: { pinp: layerId, enable } }],
			)
		}
	}

	const fadeGroup = group(layerGroups, 'pinp-fade', 'PinP & Key Fade')
	for (const key of CHOICES_PNPKEY_FADE) {
		const keyId = String(key.id)
		for (const enable of ['01', '00'] as const) {
			button(
				fadeGroup,
				`pinp_fade_${keyId}_${enable}`,
				`${key.label} Fade ${enable === '01' ? 'Enable' : 'Disable'}`,
				`${key.label}\nFADE ${enable === '01' ? 'ON' : 'OFF'}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_fade', options: { pinp: keyId, enable } }],
			)
		}
	}

	// --------------------------------------------------------- PinP/Key setup

	const pinpGroups = section('pinp-setup', 'PinP & Key Setup', 'Sources, key types and picture parameters')

	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		const keyNumber = parseInt(keyId, 16) - 0x1b + 1
		const g = group(pinpGroups, `pinp-source-${keyId}`, `${key.label} Source`)
		for (const source of CHOICES_PNPKEY_SOURCES) {
			const sourceId = String(source.id)
			button(
				g,
				`pinp_src_${keyId}_${sourceId}`,
				`${key.label} Source ${source.label}`,
				`${key.label}\n${source.label}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_setsource', options: { pinp: keyId, source: sourceId } }],
				[
					{
						feedbackId: 'pnpKeySource',
						options: { pinp: `pnpkey${keyNumber}`, source: sourceId },
						style: { bgcolor: PALETTE.layerActive, color: WHITE },
					},
				],
			)
		}
	}

	const pinpTypeGroup = group(pinpGroups, 'pinp-type', 'Key Type')
	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		for (const type of [
			{ id: '00', label: 'PinP' },
			{ id: '01', label: 'Lum-White' },
			{ id: '02', label: 'Lum-Black' },
			{ id: '03', label: 'Chroma' },
		]) {
			button(
				pinpTypeGroup,
				`pinp_type_${keyId}_${type.id}`,
				`${key.label} Type ${type.label}`,
				`${key.label}\n${type.label}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_settype', options: { pinp: keyId, type: type.id } }],
			)
		}
	}

	const pinpShapeGroup = group(pinpGroups, 'pinp-shape', 'Shape')
	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		for (const shape of [
			{ id: '00', label: 'Rectangle' },
			{ id: '01', label: 'Circle' },
			{ id: '02', label: 'Diamond' },
		]) {
			button(
				pinpShapeGroup,
				`pinp_shape_${keyId}_${shape.id}`,
				`${key.label} Shape ${shape.label}`,
				`${key.label}\n${shape.label}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_shape', options: { pinp: keyId, shape: shape.id } }],
			)
		}
	}

	const pinpBorderGroup = group(pinpGroups, 'pinp-border', 'Border Color')
	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		for (const color of CHOICES_PNPKEY_BORDER_COLORS) {
			const colorId = String(color.id)
			button(
				pinpBorderGroup,
				`pinp_border_${keyId}_${colorId}`,
				`${key.label} Border ${color.label}`,
				`${key.label}\nBorder\n${color.label}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_borderColor', options: { pinp: keyId, color: colorId } }],
			)
		}
	}

	const pinpChromaGroup = group(pinpGroups, 'pinp-chroma', 'Chroma Color')
	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		for (const color of CHOICES_CHROMA_COLORS) {
			const colorId = String(color.id)
			button(
				pinpChromaGroup,
				`pinp_chroma_${keyId}_${colorId}`,
				`${key.label} Chroma ${color.label}`,
				`${key.label}\nChroma\n${color.label}`,
				PALETTE.layer,
				[{ actionId: 'pnpkey_chromaColor', options: { pinp: keyId, color: colorId } }],
			)
		}
	}

	// One template button per numeric parameter action, per key, using the
	// action's default value — drag in and edit the value to taste.
	const pinpParamGroup = group(pinpGroups, 'pinp-params', 'Picture Parameters (edit values after adding)')
	for (const key of CHOICES_PNPKEY_HEX) {
		const keyId = String(key.id)
		const label = key.label
		const paramButtons: { id: string; name: string; text: string; down: ActionEntry[] }[] = [
			{
				id: `pinp_posh_${keyId}`,
				name: `${label} Position H`,
				text: `${label}\nPos H 50`,
				down: [{ actionId: 'pnpkey_positionH', options: { pinp: keyId, position: 50 } }],
			},
			{
				id: `pinp_posv_${keyId}`,
				name: `${label} Position V`,
				text: `${label}\nPos V 50`,
				down: [{ actionId: 'pnpkey_positionV', options: { pinp: keyId, position: 50 } }],
			},
			{
				id: `pinp_size_${keyId}`,
				name: `${label} Size`,
				text: `${label}\nSize 50`,
				down: [{ actionId: 'pnpkey_size', options: { pinp: keyId, size: 50 } }],
			},
			{
				id: `pinp_croph_${keyId}`,
				name: `${label} Cropping H`,
				text: `${label}\nCrop H 0`,
				down: [{ actionId: 'pnpkey_croppingH', options: { pinp: keyId, cropping: 0 } }],
			},
			{
				id: `pinp_cropv_${keyId}`,
				name: `${label} Cropping V`,
				text: `${label}\nCrop V 0`,
				down: [{ actionId: 'pnpkey_croppingV', options: { pinp: keyId, cropping: 0 } }],
			},
			{
				id: `pinp_borderw_${keyId}`,
				name: `${label} Border Width`,
				text: `${label}\nBorder W 5`,
				down: [{ actionId: 'pnpkey_borderWidth', options: { pinp: keyId, width: 5 } }],
			},
			{
				id: `pinp_viewposh_${keyId}`,
				name: `${label} View Position H`,
				text: `${label}\nView H 0`,
				down: [{ actionId: 'pnpkey_viewPositionH', options: { pinp: keyId, position: 0 } }],
			},
			{
				id: `pinp_viewposv_${keyId}`,
				name: `${label} View Position V`,
				text: `${label}\nView V 0`,
				down: [{ actionId: 'pnpkey_viewPositionV', options: { pinp: keyId, position: 0 } }],
			},
			{
				id: `pinp_viewzoom_${keyId}`,
				name: `${label} View Zoom`,
				text: `${label}\nZoom 100%`,
				down: [{ actionId: 'pnpkey_viewZoom', options: { pinp: keyId, zoom: 100 } }],
			},
			{
				id: `pinp_keylevel_${keyId}`,
				name: `${label} Key Level`,
				text: `${label}\nKey Lvl 50`,
				down: [{ actionId: 'pnpkey_keyLevel', options: { pinp: keyId, level: 50 } }],
			},
			{
				id: `pinp_keygain_${keyId}`,
				name: `${label} Key Gain`,
				text: `${label}\nKey Gain 50`,
				down: [{ actionId: 'pnpkey_keyGain', options: { pinp: keyId, gain: 50 } }],
			},
			{
				id: `pinp_mixlevel_${keyId}`,
				name: `${label} Mix Level`,
				text: `${label}\nMix Lvl 50`,
				down: [{ actionId: 'pnpkey_mixLevel', options: { pinp: keyId, level: 50 } }],
			},
			{
				id: `pinp_huew_${keyId}`,
				name: `${label} Hue Width`,
				text: `${label}\nHue W 0`,
				down: [{ actionId: 'pnpkey_hueWidth', options: { pinp: keyId, width: 0 } }],
			},
			{
				id: `pinp_huef_${keyId}`,
				name: `${label} Hue Fine`,
				text: `${label}\nHue F 0`,
				down: [{ actionId: 'pnpkey_hueFine', options: { pinp: keyId, fine: 0 } }],
			},
			{
				id: `pinp_satw_${keyId}`,
				name: `${label} Saturation Width`,
				text: `${label}\nSat W 0`,
				down: [{ actionId: 'pnpkey_saturationWidth', options: { pinp: keyId, width: 0 } }],
			},
			{
				id: `pinp_satf_${keyId}`,
				name: `${label} Saturation Fine`,
				text: `${label}\nSat F 0`,
				down: [{ actionId: 'pnpkey_saturationFine', options: { pinp: keyId, fine: 0 } }],
			},
			{
				id: `pinp_bred_${keyId}`,
				name: `${label} Border Red`,
				text: `${label}\nBorder R 0`,
				down: [{ actionId: 'pnpkey_borderColorRed', options: { pinp: keyId, red: 0 } }],
			},
			{
				id: `pinp_bgreen_${keyId}`,
				name: `${label} Border Green`,
				text: `${label}\nBorder G 0`,
				down: [{ actionId: 'pnpkey_borderColorGreen', options: { pinp: keyId, green: 0 } }],
			},
			{
				id: `pinp_bblue_${keyId}`,
				name: `${label} Border Blue`,
				text: `${label}\nBorder B 0`,
				down: [{ actionId: 'pnpkey_borderColorBlue', options: { pinp: keyId, blue: 0 } }],
			},
		]
		for (const p of paramButtons) {
			button(pinpParamGroup, p.id, p.name, p.text, PALETTE.layer, p.down)
		}
	}

	// Legacy numeric variants of the source/type actions, one button per key
	const pinpLegacyGroup = group(pinpGroups, 'pinp-legacy', 'Legacy Source/Type Actions')
	for (const key of CHOICES_PINP_KEYS) {
		const keyId = Number(key.id)
		button(
			pinpLegacyGroup,
			`pinp_legacy_src_${keyId}`,
			`${key.label} Source (legacy)`,
			`${key.label}\nSource`,
			PALETTE.layer,
			[{ actionId: 'set_pinp_source', options: { pinp: keyId, assign: 0 } }],
		)
		button(
			pinpLegacyGroup,
			`pinp_legacy_type_${keyId}`,
			`${key.label} Type (legacy)`,
			`${key.label}\nType PinP`,
			PALETTE.layer,
			[{ actionId: 'set_pinp_type', options: { pinp: keyId, key: 0 } }],
		)
	}

	// -------------------------------------------------------------- DSK setup

	const dskGroups = section('dsk-setup', 'DSK Setup', 'DSK key/fill sources and key types')

	for (const dsk of CHOICES_DSK) {
		const dskId = Number(dsk.id)
		const keyGroup = group(dskGroups, `dsk-key-src-${dskId}`, `${dsk.label} Key Source`)
		const fillGroup = group(dskGroups, `dsk-fill-src-${dskId}`, `${dsk.label} Fill Source`)
		for (const source of CHOICES_INPUTSASSIGN) {
			const assign = Number(source.id)
			button(
				keyGroup,
				`dsk_key_src_${dskId}_${assign}`,
				`${dsk.label} Key Source ${source.label}`,
				`${dsk.label} KEY\n${source.label}`,
				PALETTE.layer,
				[{ actionId: 'set_dsk_key_source', options: { dsk: dskId, assign } }],
			)
			button(
				fillGroup,
				`dsk_fill_src_${dskId}_${assign}`,
				`${dsk.label} Fill Source ${source.label}`,
				`${dsk.label} FILL\n${source.label}`,
				PALETTE.layer,
				[{ actionId: 'set_dsk_fill_source', options: { dsk: dskId, assign } }],
			)
		}
	}

	const dskTypeGroup = group(dskGroups, 'dsk-type', 'DSK Key Type')
	for (const dsk of CHOICES_DSK) {
		const dskId = Number(dsk.id)
		for (const type of CHOICES_DSK_TYPES) {
			button(
				dskTypeGroup,
				`dsk_type_${dskId}_${type.id}`,
				`${dsk.label} Type ${type.label}`,
				`${dsk.label}\n${type.label}`,
				PALETTE.layer,
				[{ actionId: 'set_dsk_type', options: { dsk: dskId, key: Number(type.id) } }],
			)
		}
	}

	// -------------------------------------------------------------------- Aux

	const auxGroups = section('aux', 'AUX', 'Aux bus sources, mutes and PGM linking')

	for (const [index, aux] of CHOICES_AUX_SOURCE_ADDRESSES.entries()) {
		const auxAddress = String(aux.id)
		const auxKey = `aux${index + 1}`
		const g = group(auxGroups, `aux-source-${auxKey}`, `${aux.label} Source`)
		for (const source of CHOICES_PGMPVW_SELECT) {
			const sourceId = String(source.id)
			button(
				g,
				`${auxKey}_src_${sourceId}`,
				`${aux.label} Source ${source.label}`,
				`${aux.label}\n${source.label}`,
				PALETTE.aux,
				[{ actionId: 'aux_assign', options: { aux: auxAddress, assign: sourceId } }],
				[
					{
						feedbackId: 'auxTally',
						options: { aux: auxKey, assign: sourceId },
						style: { bgcolor: PALETTE.auxActive, color: WHITE },
					},
				],
			)
		}
	}

	const auxMuteGroup = group(auxGroups, 'aux-mute', 'Aux Mute')
	for (const [index, aux] of CHOICES_AUX_MUTE_ADDRESSES.entries()) {
		const auxAddress = String(aux.id)
		const auxKey = `aux${index + 1}`
		for (const mute of ['01', '00'] as const) {
			button(
				auxMuteGroup,
				`${auxKey}_mute_${mute}`,
				`${aux.label} ${mute === '01' ? 'Mute' : 'Unmute'}`,
				`${aux.label}\n${mute === '01' ? 'MUTE' : 'UNMUTE'}`,
				PALETTE.aux,
				[{ actionId: 'aux_mute', options: { aux: auxAddress, mute } }],
				[
					{
						feedbackId: 'auxMute',
						options: { aux: auxKey, mute: '01' },
						style: { bgcolor: PALETTE.programActive, color: WHITE },
					},
				],
			)
		}
	}

	const auxLinkGroup = group(auxGroups, 'aux-link', 'Aux Link')
	for (const [index, aux] of CHOICES_AUX_LINK_ADDRESSES.entries()) {
		const auxAddress = String(aux.id)
		const auxKey = `aux${index + 1}`
		for (const link of ['01', '00'] as const) {
			button(
				auxLinkGroup,
				`${auxKey}_link_${link}`,
				`${aux.label} Link ${link === '01' ? 'On' : 'Off'}`,
				`${aux.label}\nLINK ${link === '01' ? 'ON' : 'OFF'}`,
				PALETTE.aux,
				[{ actionId: 'aux_linked', options: { aux: auxAddress, value: link } }],
				[
					{
						feedbackId: 'auxLink',
						options: { aux: auxKey, link: '01' },
						style: { bgcolor: PALETTE.auxActive, color: WHITE },
					},
				],
			)
		}
	}

	const auxLinkModeGroup = group(auxGroups, 'aux-link-mode', 'Aux Linked PGM Mode')
	for (const mode of CHOICES_AUX_LINK_MODES) {
		const modeId = String(mode.id)
		button(
			auxLinkModeGroup,
			`aux_link_mode_${modeId}`,
			`Aux Link Mode ${mode.label}`,
			`AUX LINK\n${mode.label}`,
			PALETTE.aux,
			[{ actionId: 'aux_linked_pgm_mode', options: { mode: modeId } }],
			[
				{
					feedbackId: 'auxLinkMode',
					options: { mode: modeId },
					style: { bgcolor: PALETTE.auxActive, color: WHITE },
				},
			],
		)
	}

	// ---------------------------------------------------------------- Outputs

	const outputGroups = section('outputs', 'Outputs', 'Assign a bus to each physical output')
	for (const output of CHOICES_OUTPUTS) {
		const outputAddress = String(output.id)
		const g = group(outputGroups, `output-${outputAddress}`, output.label)
		for (const assign of CHOICES_OUTPUTSASSIGN) {
			const assignId = String(assign.id)
			button(
				g,
				`out_${outputAddress}_${assignId}`,
				`${output.label}: ${assign.label}`,
				`${output.label}\n${assign.label}`,
				PALETTE.routing,
				[{ actionId: 'output_assign', options: { output: outputAddress, assign: assignId } }],
				[
					{
						feedbackId: 'outputAssign',
						options: { output: outputAddress, assign: assignId },
						style: { bgcolor: PALETTE.routingActive, color: WHITE },
					},
				],
			)
		}
	}

	// ----------------------------------------------------------------- Inputs

	const inputGroups = section('inputs', 'Inputs', 'Assign a source to each input channel')
	for (const input of CHOICES_INPUTS) {
		const inputId = Number(input.id)
		const g = group(inputGroups, `input-${inputId}`, input.label)
		for (const assign of CHOICES_INPUTSASSIGN) {
			const assignId = Number(assign.id)
			button(
				g,
				`in_${inputId}_${assignId}`,
				`${input.label}: ${assign.label}`,
				`${input.label}\n${assign.label}`,
				PALETTE.routing,
				[{ actionId: 'input_assign', options: { input: inputId, assign: assignId } }],
			)
		}
	}

	// ----------------------------------------------------------------- Memory

	const memoryGroups = section('memory', 'Memory', 'Load, save and initialize switcher memories')

	const memLoadGroup = group(memoryGroups, 'memory-load', 'Load Memory')
	const memSaveGroup = group(memoryGroups, 'memory-save', 'Save Memory')
	const memInitGroup = group(memoryGroups, 'memory-init', 'Initialize Memory')
	for (const memory of CHOICES_MEMORY) {
		const memoryId = Number(memory.id)
		const humanNumber = memoryId + 1
		button(
			memLoadGroup,
			`mem_load_${memoryId}`,
			`Load ${memory.label}`,
			`LOAD ${humanNumber}\n$(${VAR}:memoryname_${humanNumber})`,
			PALETTE.memory,
			[{ actionId: 'load_memory_trigger', options: { memory: memoryId } }],
			[
				{
					feedbackId: 'lastMemory',
					options: { memory: memoryId },
					style: { bgcolor: PALETTE.memoryActive, color: WHITE },
				},
			],
		)
		button(
			memSaveGroup,
			`mem_save_${memoryId}`,
			`Save ${memory.label}`,
			`SAVE ${humanNumber}\n$(${VAR}:memoryname_${humanNumber})`,
			PALETTE.memory,
			[{ actionId: 'save_memory_trigger', options: { memory: memoryId } }],
		)
		button(memInitGroup, `mem_init_${memoryId}`, `Initialize ${memory.label}`, `INIT ${humanNumber}`, PALETTE.memory, [
			{ actionId: 'initialize_memory_trigger', options: { memory: memoryId } },
		])
	}

	// ----------------------------------------------------------------- Freeze

	const freezeGroups = section('freeze', 'Freeze', 'Input freeze control')

	const freezeGroup = group(freezeGroups, 'freeze-switch', 'Freeze')
	button(
		freezeGroup,
		'freeze_on',
		'Freeze On',
		'FREEZE\nON',
		PALETTE.freeze,
		[{ actionId: 'freezeSwitchOn', options: {} }],
		[
			{
				feedbackId: 'freeze',
				options: {},
				style: { bgcolor: PALETTE.freezeActive, color: combineRgb(0, 0, 0) },
			},
		],
	)
	button(
		freezeGroup,
		'freeze_off',
		'Freeze Off',
		'FREEZE\nOFF',
		PALETTE.freeze,
		[{ actionId: 'freezeSwitchOff', options: {} }],
		[
			{
				feedbackId: 'freeze',
				options: {},
				style: { bgcolor: PALETTE.freezeActive, color: combineRgb(0, 0, 0) },
			},
		],
	)
	for (const type of CHOICES_FREEZE_TYPES) {
		const typeId = String(type.id)
		button(
			freezeGroup,
			`freeze_type_${typeId}`,
			`Freeze Type ${type.label}`,
			`FREEZE\nTYPE ${type.label}`,
			PALETTE.freeze,
			[{ actionId: 'freezeSwitchType', options: { type: typeId } }],
		)
	}

	const freezeSelectGroup = group(freezeGroups, 'freeze-select', 'Freeze Select')
	for (const input of CHOICES_FREEZE_INPUTS) {
		const inputId = String(input.id)
		for (const enable of ['01', '00'] as const) {
			button(
				freezeSelectGroup,
				`freeze_sel_${inputId}_${enable}`,
				`Freeze Select ${input.label} ${enable === '01' ? 'Enable' : 'Disable'}`,
				`FRZ ${enable === '01' ? 'EN' : 'DIS'}\n${input.label}`,
				PALETTE.freeze,
				[{ actionId: 'freezeSwitchSelectEnableDisable', options: { input: inputId, enable } }],
			)
		}
	}

	// ----------------------------------------------------------------- Camera

	const cameraGroups = section(
		'camera',
		'Camera Control',
		'PTZ control. Control buttons act on the camera chosen with Select Camera.',
	)

	const camSelectGroup = group(cameraGroups, 'camera-select', 'Select Camera')
	for (const camera of CHOICES_CAMERAS) {
		const cameraId = String(camera.id)
		button(
			camSelectGroup,
			`cam_select_${cameraId}`,
			`Select ${camera.label}`,
			`SELECT\n${camera.label}`,
			PALETTE.camera,
			[{ actionId: 'selectCamera', options: { camera: cameraId } }],
			[
				{
					feedbackId: 'selectedCamera',
					options: { camera: cameraId },
					style: { bgcolor: PALETTE.cameraActive, color: WHITE },
				},
			],
		)
	}

	const camPresetGroup = group(cameraGroups, 'camera-presets', 'Camera Presets (selected camera)')
	for (const preset of CHOICES_CAMERA_PRESETS) {
		const presetId = String(preset.id)
		button(
			camPresetGroup,
			`cam_preset_${presetId}`,
			`Camera Preset ${preset.label}`,
			`CAM\nPRESET ${preset.label}`,
			PALETTE.camera,
			[{ actionId: 'cameraCurrentPreset', options: { useSelected: true, camera: '41', preset: presetId } }],
		)
	}

	const camPtzGroup = group(cameraGroups, 'camera-ptz', 'Pan / Tilt / Zoom (selected camera)')
	const cam = { useSelected: true, camera: '41' }
	const ptzButtons: { id: string; name: string; text: string; down: ActionEntry[]; up?: ActionEntry[] }[] = [
		{
			id: 'cam_pan_left',
			name: 'Pan Left (hold)',
			text: 'PAN\n<',
			down: [{ actionId: 'cameraPanLeft', options: cam }],
			up: [{ actionId: 'cameraPanStop', options: cam }],
		},
		{
			id: 'cam_pan_right',
			name: 'Pan Right (hold)',
			text: 'PAN\n>',
			down: [{ actionId: 'cameraPanRight', options: cam }],
			up: [{ actionId: 'cameraPanStop', options: cam }],
		},
		{ id: 'cam_pan_stop', name: 'Pan Stop', text: 'PAN\nSTOP', down: [{ actionId: 'cameraPanStop', options: cam }] },
		{
			id: 'cam_tilt_up',
			name: 'Tilt Up (hold)',
			text: 'TILT\n^',
			down: [{ actionId: 'cameraTiltUp', options: cam }],
			up: [{ actionId: 'cameraTiltStop', options: cam }],
		},
		{
			id: 'cam_tilt_down',
			name: 'Tilt Down (hold)',
			text: 'TILT\nv',
			down: [{ actionId: 'cameraTiltDown', options: cam }],
			up: [{ actionId: 'cameraTiltStop', options: cam }],
		},
		{
			id: 'cam_tilt_stop',
			name: 'Tilt Stop',
			text: 'TILT\nSTOP',
			down: [{ actionId: 'cameraTiltStop', options: cam }],
		},
		{
			id: 'cam_zoom_in_fast',
			name: 'Zoom In Fast (hold)',
			text: 'ZOOM\nIN FAST',
			down: [{ actionId: 'cameraZoomInFast', options: cam }],
			up: [{ actionId: 'cameraZoomStop', options: cam }],
		},
		{
			id: 'cam_zoom_in_slow',
			name: 'Zoom In Slow (hold)',
			text: 'ZOOM\nIN SLOW',
			down: [{ actionId: 'cameraZoomInSlow', options: cam }],
			up: [{ actionId: 'cameraZoomStop', options: cam }],
		},
		{
			id: 'cam_zoom_out_fast',
			name: 'Zoom Out Fast (hold)',
			text: 'ZOOM\nOUT FAST',
			down: [{ actionId: 'cameraZoomOutFast', options: cam }],
			up: [{ actionId: 'cameraZoomStop', options: cam }],
		},
		{
			id: 'cam_zoom_out_slow',
			name: 'Zoom Out Slow (hold)',
			text: 'ZOOM\nOUT SLOW',
			down: [{ actionId: 'cameraZoomOutSlow', options: cam }],
			up: [{ actionId: 'cameraZoomStop', options: cam }],
		},
		{
			id: 'cam_zoom_stop',
			name: 'Zoom Stop',
			text: 'ZOOM\nSTOP',
			down: [{ actionId: 'cameraZoomStop', options: cam }],
		},
		{
			id: 'cam_pt_speed',
			name: 'Pan/Tilt Speed 10',
			text: 'PT\nSPEED 10',
			down: [{ actionId: 'cameraPTSpeed', options: { ...cam, speed: 10 } }],
		},
	]
	for (const p of ptzButtons) {
		presets[p.id] = {
			type: 'simple',
			name: p.name,
			style: style(p.text, PALETTE.camera),
			steps: [{ down: p.down, up: p.up ?? [] }],
			feedbacks: [],
		}
		camPtzGroup.presets.push(p.id)
	}

	const camFocusGroup = group(cameraGroups, 'camera-focus', 'Focus & Exposure (selected camera)')
	for (const focus of [
		{ id: '7F', label: 'Near' },
		{ id: '01', label: 'Far' },
		{ id: '00', label: 'Stop' },
	]) {
		button(camFocusGroup, `cam_focus_${focus.id}`, `Focus ${focus.label}`, `FOCUS\n${focus.label}`, PALETTE.camera, [
			{ actionId: 'focus', options: { ...cam, focus: focus.id } },
		])
	}
	button(camFocusGroup, 'cam_af_on', 'Auto Focus On', 'AF\nON', PALETTE.camera, [
		{ actionId: 'autoFocusOn', options: cam },
	])
	button(camFocusGroup, 'cam_af_off', 'Auto Focus Off', 'AF\nOFF', PALETTE.camera, [
		{ actionId: 'autoFocusOff', options: cam },
	])
	for (const exposure of [
		{ id: '01', label: 'Auto' },
		{ id: '00', label: 'Manual' },
	]) {
		button(
			camFocusGroup,
			`cam_exposure_${exposure.id}`,
			`Exposure ${exposure.label}`,
			`EXPOSURE\n${exposure.label}`,
			PALETTE.camera,
			[{ actionId: 'cameraExposure', options: { ...cam, exposure: exposure.id } }],
		)
	}

	const camTallyGroup = group(cameraGroups, 'camera-tally', 'Camera Tally Channel (selected camera)')
	for (const channel of CHOICES_CAMERA_TALLY_INPUTS) {
		const channelId = String(channel.id)
		button(
			camTallyGroup,
			`cam_tally_${channelId}`,
			`Camera Tally ${channel.label}`,
			`CAM TALLY\n${channel.label}`,
			PALETTE.camera,
			[{ actionId: 'cameraSetTallyChannel', options: { ...cam, channel: channelId } }],
		)
	}

	// -------------------------------------------------------- Panel switches

	const panelGroups = section('panel', 'Panel Switches', 'Emulate pressing the physical panel controls')

	const panelGroup = group(panelGroups, 'panel-switches', 'Press & Release')
	for (const sw of CHOICES_SWITCHES) {
		const switchId = String(sw.id)
		button(panelGroup, `sw_${switchId}`, sw.label, sw.label, PALETTE.panel, [
			{ actionId: 'press_and_release_switch', options: { switch: switchId } },
		])
	}

	const panelHoldGroup = group(panelGroups, 'panel-hold', 'Hold / Release')
	presets['sw_hold_cut'] = {
		type: 'simple',
		name: 'CUT (hold while pressed)',
		style: style('CUT\n(HOLD)', PALETTE.panel),
		steps: [
			{
				down: [{ actionId: 'press_switch', options: { switch: SWITCH_CUT } }],
				up: [{ actionId: 'release_switch', options: { switch: SWITCH_CUT } }],
			},
		],
		feedbacks: [],
	}
	panelHoldGroup.presets.push('sw_hold_cut')
	presets['sw_hold_auto'] = {
		type: 'simple',
		name: 'AUTO (hold while pressed)',
		style: style('AUTO\n(HOLD)', PALETTE.panel),
		steps: [
			{
				down: [{ actionId: 'press_switch', options: { switch: SWITCH_AUTO } }],
				up: [{ actionId: 'release_switch', options: { switch: SWITCH_AUTO } }],
			},
		],
		feedbacks: [],
	}
	panelHoldGroup.presets.push('sw_hold_auto')

	// ----------------------------------------------------------------- System

	const systemGroups = section('system', 'System & Macros', 'Macros and device info')

	const macroGroup = group(systemGroups, 'macros', 'Macros')
	for (let macro = 1; macro <= 100; macro++) {
		button(macroGroup, `macro_${macro}`, `Run Macro ${macro}`, `MACRO\n${macro}`, PALETTE.system, [
			{ actionId: 'run_macro', options: { macro } },
		])
	}

	const infoGroup = group(systemGroups, 'info', 'Device Info')
	button(infoGroup, 'device_info', 'Device Info', `$(${VAR}:model)\n$(${VAR}:version)`, PALETTE.system, [])
	button(infoGroup, 'last_memory_info', 'Last Memory Loaded', `MEM\n$(${VAR}:lastmemoryname)`, PALETTE.system, [])

	self.setPresetDefinitions(structure, presets)
}
