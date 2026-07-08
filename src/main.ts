import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, type TCPHelper } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdateVariableDefinitions, updateVariableValues, type VariablesSchema } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import { initConnection, teardownConnection } from './api.js'
import { createEmptyState, type V160State } from './state.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // assigned in init()
	state: V160State = createEmptyState()

	socket: TCPHelper | undefined
	pollTimer: NodeJS.Timeout | undefined
	/** Pending release timers created by the press-and-release action */
	pressTimers = new Set<NodeJS.Timeout>()

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.updateStatus(InstanceStatus.Connecting)

		UpdateActions(this)
		UpdateFeedbacks(this)
		UpdateVariableDefinitions(this)
		UpdatePresets(this)

		updateVariableValues(this)
		this.checkAllFeedbacks()

		initConnection(this)
	}

	async destroy(): Promise<void> {
		teardownConnection(this)
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		teardownConnection(this)
		this.state = createEmptyState()

		updateVariableValues(this)
		this.checkAllFeedbacks()

		initConnection(this)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}
}
