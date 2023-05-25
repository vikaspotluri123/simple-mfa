import {webcrypto} from 'node:crypto';
import {type SimpleMfaConfig, type InternalSimpleMfaConfig, type UntypedStrategyRecord, type StrategyConfig} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID.bind(webcrypto);

const DEFAULT_STRATEGY_SERIALIZER = async (
	store: SerializedAuthStrategy<string>,
	isTrusted: boolean,
	getSecret: (store: SerializedAuthStrategy<string>, config: StrategyConfig) => unknown,
	config: StrategyConfig,
) => {
	const cloned: Partial<SerializedAuthStrategy<string>> = {...store};

	if (isTrusted && store.status === 'pending') {
		cloned.context = await getSecret(store, config);
	} else {
		delete cloned.context;
	}

	return cloned;
};

export function coerce<TStrategies extends UntypedStrategyRecord>(config: SimpleMfaConfig<TStrategies>): InternalSimpleMfaConfig<TStrategies> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		strategies,
		crypto,
	} = config;

	for (const strategy of Object.values(strategies)) {
		strategy.serialize ??= DEFAULT_STRATEGY_SERIALIZER;
		strategy.getSecret = strategy.getSecret.bind(strategy);
	}

	return {
		config: {generateId, crypto},
		strategies: strategies as Required<TStrategies>,
	};
}
