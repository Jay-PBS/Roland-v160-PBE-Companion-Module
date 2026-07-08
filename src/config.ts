import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export type ModuleConfig = {
	host: string
	password: string
	polling: boolean
	pollingrate: number
	verbose: boolean
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
			type: 'textinput',
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
			min: 100,
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
