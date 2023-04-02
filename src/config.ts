import {webcrypto} from 'node:crypto';
import {StrategyError} from './error.js';
import {type SimpleMfaConfig, type InternalSimpleMfaConfig, type UntypedStrategyRecord} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID;

const DEFAULT_STRATEGY_SERIALIZER = (store: SerializedAuthStrategy<string>) => {
	const cloned: Partial<SerializedAuthStrategy<string>> = {...store};
	delete cloned.context;
	return cloned;
};

export function coerce<TStrategies>(config: SimpleMfaConfig<TStrategies>): InternalSimpleMfaConfig<TStrategies> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		sendEmail = () => {
			throw new StrategyError('sendEmail was used but not provided when initializing the service', false);
		},
		strategies,
	} = config;

	for (const strategy of Object.values(strategies as Record<string, TStrategies>)) {
		(strategy as UntypedStrategyRecord[string]).serialize ??= DEFAULT_STRATEGY_SERIALIZER;
	}

	return {
		config: {generateId, sendEmail},
		strategies: strategies as Required<TStrategies>,
	};
}
