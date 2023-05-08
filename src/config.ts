import {webcrypto} from 'node:crypto';
import {type SimpleMfaConfig, type InternalSimpleMfaConfig, type UntypedStrategyRecord} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

const DEFAULT_ID_GENERATOR = webcrypto.randomUUID;

const DEFAULT_STRATEGY_SERIALIZER = async (
	store: SerializedAuthStrategy<string>,
	isTrusted: boolean,
	share: (store: SerializedAuthStrategy<string>) => unknown,
) => {
	const cloned: Partial<SerializedAuthStrategy<string>> = {...store};

	if (isTrusted && store.status === 'pending') {
		cloned.context = await share(store);
	} else {
		delete cloned.context;
	}

	return cloned;
};

export function coerce<TStrategies>(config: SimpleMfaConfig<TStrategies>): InternalSimpleMfaConfig<TStrategies> {
	const {
		generateId = DEFAULT_ID_GENERATOR,
		strategies,
	} = config;

	for (const strategy of Object.values(strategies as Record<string, TStrategies>)) {
		(strategy as UntypedStrategyRecord[string]).serialize ??= DEFAULT_STRATEGY_SERIALIZER;
	}

	return {
		config: {generateId},
		strategies: strategies as Required<TStrategies>,
	};
}
