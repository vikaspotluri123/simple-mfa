import {webcrypto} from 'node:crypto';
import {StrategyError} from './error.js';
import {type StrategyRecord, type CreateSimpleMfaConfig, type CoercedConfig} from './interfaces/config.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID;

function createStrategyLut(strategies: Array<StrategyRecord[string]>): StrategyRecord {
	if (strategies.length === 0) {
		throw new StrategyError('No MFA strategies were defined', false);
	}

	const response = Object.create(null) as Record<string, typeof strategies[number]>;
	for (const [index, strategy] of strategies.entries()) {
		if (typeof strategy.type !== 'string') {
			throw new StrategyError(`Strategy at position ${index} does not have a valid "type"`, false);
		}

		if (Object.hasOwnProperty.call(response, strategy.type)) {
			throw new StrategyError(`Attempted to add multiple handlers for ${strategy.type} strategy`, false);
		}

		response[strategy.type] = strategy;
	}

	return response;
}

export function coerce(config: Partial<CreateSimpleMfaConfig>): CoercedConfig {
	const {generateId = DEFAULT_ID_GENERATOR, strategies = []} = config;

	return {
		strategyConfig: {generateId},
		strategyLut: createStrategyLut(strategies),
	};
}
