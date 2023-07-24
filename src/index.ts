import {coerce} from './config.js';
import {type UntypedStrategyRecord, type SimpleMfaConfig} from './interfaces/config.js';
import {type Public} from './interfaces/shared.js';
import {createStrategyWrapper} from './wrapper.js';

export const createSimpleMfa = <
	TStrategies extends UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
>(
	config: Public<SimpleMfaConfig<TStrategies, TExtraFields>>,
) => createStrategyWrapper<TStrategies, TExtraFields>(coerce(config));

export * from './public-api.js';
