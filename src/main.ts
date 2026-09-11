import { InstanceBase, InstanceStatus, type SomeCompanionConfigField, type TCPHelper } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig, type ModuleSecrets } from './config.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdateVariableDefinitions, updateVariableValues, type VariablesSchema } from './variables.js'
import { UpdatePresets } from './presets.js'
import { UpgradeScripts } from './upgrades.js'
import { initConnection, teardownConnection, createConnectionRuntime, type ConnectionRuntime } from './api.js'
import { createEmptyState, type V160State } from './state.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: ModuleSecrets
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export default class ModuleInstance extends InstanceBase<ModuleSchema> {
	config!: ModuleConfig // assigned in init()
	/** Passcode, held in the secrets store rather than the config store */
	secrets: ModuleSecrets = { password: '' }
	state: V160State = createEmptyState()

	socket: TCPHelper | undefined
	/** Connection-layer runtime: rx buffer, auth flags, watchdog and debounce timers */
	conn: ConnectionRuntime = createConnectionRuntime()
	pollTimer: NodeJS.Timeout | undefined
	/** Pending release timers created by the press-and-release action */
	pressTimers = new Set<NodeJS.Timeout>()

	async init(config: ModuleConfig, _isFirstInit: boolean, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? { password: '' }
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

	async configUpdated(config: ModuleConfig, secrets: ModuleSecrets): Promise<void> {
		this.config = config
		this.secrets = secrets ?? { password: '' }

		teardownConnection(this)
		// Editing the config is an explicit correction, so let a login that was
		// previously rejected or locked out be attempted again.
		this.conn.authFailed = false
		this.state = createEmptyState()

		updateVariableValues(this)
		this.checkAllFeedbacks()

		initConnection(this)
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}
}
