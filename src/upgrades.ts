import {
	EmptyUpgradeScript,
	type CompanionMigrationOptionValues,
	type CompanionStaticUpgradeProps,
	type CompanionStaticUpgradeResult,
	type CompanionStaticUpgradeScript,
	type CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

/**
 * Replace a plain (non-expression) option value if it matches. Returns true if changed.
 */
function replaceOptionValue(
	options: CompanionMigrationOptionValues,
	key: string,
	from: string | number,
	to: string | number,
): boolean {
	const opt = options[key]
	if (opt && !opt.isExpression && opt.value === from) {
		options[key] = { value: to, isExpression: false }
		return true
	}
	return false
}

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	// v2.x of the original module shipped a single empty upgrade script;
	// this placeholder keeps the chain position stable. Append-only below.
	EmptyUpgradeScript,

	// v1.0.0 of this fork: config pollingrate became a number field, and
	// several broken stored option defaults from the original module are
	// migrated to valid choice values.
	(
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig, undefined>,
	): CompanionStaticUpgradeResult<ModuleConfig, undefined> => {
		const result: CompanionStaticUpgradeResult<ModuleConfig, undefined> = {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}

		if (props.config) {
			const rawRate = props.config.pollingrate as unknown
			if (typeof rawRate === 'string' || rawRate === undefined || rawRate === null) {
				const parsed = typeof rawRate === 'string' ? parseInt(rawRate, 10) : NaN
				result.updatedConfig = {
					...props.config,
					pollingrate: Number.isNaN(parsed) ? 1000 : parsed,
				}
			}
		}

		for (const action of props.actions) {
			let changed = false
			if (action.actionId === 'aux_mute') {
				// The original module's default was the invalid value 1
				changed = replaceOptionValue(action.options, 'mute', 1, '01') || changed
			}
			if (action.actionId === 'freezeSwitchSelectEnableDisable') {
				changed = replaceOptionValue(action.options, 'enable', 1, '01') || changed
			}
			if (changed) result.updatedActions.push(action)
		}

		for (const feedback of props.feedbacks) {
			let changed = false
			if (feedback.feedbackId === 'pnpKeySource') {
				// The original module's default was the invalid value '1B'
				changed = replaceOptionValue(feedback.options, 'pinp', '1B', 'pnpkey1') || changed
				changed = replaceOptionValue(feedback.options, 'pinp', '1C', 'pnpkey2') || changed
				changed = replaceOptionValue(feedback.options, 'pinp', '1D', 'pnpkey3') || changed
				changed = replaceOptionValue(feedback.options, 'pinp', '1E', 'pnpkey4') || changed
			}
			if (['auxTally', 'auxMute', 'auxLink'].includes(feedback.feedbackId)) {
				// The original module's default was the invalid value '11'
				changed = replaceOptionValue(feedback.options, 'aux', '11', 'aux1') || changed
			}
			if (changed) result.updatedFeedbacks.push(feedback)
		}

		return result
	},
]
