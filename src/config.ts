import {webcrypto} from 'node:crypto';
import {StrategyError} from './error.js';
import {type SimpleMfaConfig, type CoercedConfig} from './interfaces/config.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID;

export function coerce<TStrategies>(config: SimpleMfaConfig<TStrategies>): CoercedConfig<TStrategies> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		sendEmail = () => {
			throw new StrategyError('sendEmail was used but not provided when initializing the service', false);
		},
		strategies,
	} = config;

	return {
		strategyConfig: {generateId, sendEmail},
		strategies,
	};
}
