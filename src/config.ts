import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { MIN_POLL_RATE_MS } from './constants.js'

export type ModuleConfig = {
	host: string
	/**
	 * Legacy plaintext password. Retained only so the upgrade script can migrate
	 * existing connections into the secrets store, and so a connection whose
	 * upgrade has not run yet still authenticates. New connections leave it unset.
	 */
	password?: string
	polling: boolean
	pollingrate: number
	verbose: boolean
}

/**
 * Values held in Companion's secrets store rather than the config store. Only the
 * keys are reported to the web UI, so the passcode is never round-tripped back.
 */
export type ModuleSecrets = {
	password: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Information',
			value:
				'This module connects to a Roland V-160HD over the LAN (TCP port 8023). ' +
				'A password/passcode must be configured on the switcher, otherwise certain actions may not work.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'IP Address',
			width: 6,
			default: '192.168.0.1',
			regex: Regex.IP,
		},
		{
			type: 'secret-text',
			id: 'password',
			label: 'Password',
			width: 6,
			default: '0000',
		},
		{
			type: 'static-text',
			id: 'info-polling',
			label: 'Polling',
			width: 12,
			value:
				'Enabling polling unlocks the tally, PnP/Key, Aux, output and memory feedbacks and variables. ' +
				'Polling sends requests to the device at a continuous interval, which could have a performance ' +
				'effect on your device depending on the polling rate.',
		},
		{
			type: 'checkbox',
			id: 'polling',
			label: 'Enable Polling (necessary for feedbacks and variables)',
			default: false,
			width: 3,
			disableAutoExpression: true,
		},
		{
			type: 'number',
			id: 'pollingrate',
			label: 'Polling Rate (in ms)',
			default: 1000,
			min: MIN_POLL_RATE_MS,
			max: 60000,
			width: 3,
			isVisibleExpression: '!!$(options:polling)',
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Enable Verbose Logging',
			default: false,
			width: 3,
		},
		{
			type: 'static-text',
			id: 'info-verbose',
			width: 9,
			label: ' ',
			value: 'Verbose logging pushes all incoming and outgoing data to the log, which is helpful for debugging.',
		},
	]
}
