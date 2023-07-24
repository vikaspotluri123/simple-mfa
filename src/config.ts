import {webcrypto} from 'node:crypto';
import {type SimpleMfaConfig, type InternalSimpleMfaConfig, type UntypedStrategyRecord, type StrategyConfig} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';
import {type SerializationResponse} from './interfaces/shared.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID.bind(webcrypto);

const DEFAULT_STRATEGY_SERIALIZER = async (
	store: SerializedAuthStrategy<string>,
	isTrusted: boolean,
	getSecret: (store: SerializedAuthStrategy<string>, config: StrategyConfig) => unknown,
	config: StrategyConfig,
) => {
	const cloned: SerializationResponse<string> = {...store};

	if (isTrusted && store.status === 'pending') {
		cloned.context = await getSecret(store, config);
	} else {
		delete cloned.context;
	}

	return cloned;
};

export function coerce<
	TStrategies extends UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
>(config: SimpleMfaConfig<TStrategies, TExtraFields>): InternalSimpleMfaConfig<TStrategies, TExtraFields> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		strategies,
		crypto,
		customStoredFields,
	} = config;

	for (const strategy of Object.values(strategies)) {
		strategy.serialize ??= DEFAULT_STRATEGY_SERIALIZER;
		strategy.getSecret = strategy.getSecret.bind(strategy);
	}

	return {
		config: {generateId, crypto},
		strategies: strategies as Required<TStrategies>,
		customStoredFields,
	};
}
