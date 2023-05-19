import {webcrypto} from 'node:crypto';
import {type SimpleMfaConfig, type InternalSimpleMfaConfig, type UntypedStrategyRecord} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID.bind(webcrypto);

const DEFAULT_STRATEGY_SERIALIZER = async (
	store: SerializedAuthStrategy<string>,
	isTrusted: boolean,
	getSecret: (store: SerializedAuthStrategy<string>) => unknown,
) => {
	const cloned: Partial<SerializedAuthStrategy<string>> = {...store};

	if (isTrusted && store.status === 'pending') {
		cloned.context = await getSecret(store);
	} else {
		delete cloned.context;
	}

	return cloned;
};

export function coerce<TStrategies extends UntypedStrategyRecord>(config: SimpleMfaConfig<TStrategies>): InternalSimpleMfaConfig<TStrategies> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		strategies,
	} = config;

	for (const strategy of Object.values(strategies)) {
		strategy.serialize ??= DEFAULT_STRATEGY_SERIALIZER;
	}

	return {
		config: {generateId},
		strategies: strategies as Required<TStrategies>,
	};
}
