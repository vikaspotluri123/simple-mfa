import {StrategyError} from './error.js';
import {type CoercedConfig} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

export function createStrategyWrapper(config: CoercedConfig) {
	const {strategyConfig, strategyLut} = config;

	return {
		create(type: string, owner: string) {
			const strategy = strategyLut[type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.create(owner, strategyConfig);
		},

		validate(storedStrategy: SerializedAuthStrategy<unknown>, userPayload: unknown) {
			const strategy = strategyLut[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.validate(storedStrategy.context, userPayload);
		},
	};
}
