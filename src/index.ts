import {coerce} from './config.js';
import {type UntypedStrategyRecord, type SimpleMfaConfig} from './interfaces/config.js';
import {createStrategyWrapper} from './wrapper.js';

export const createSimpleMFA = <TStrategies extends UntypedStrategyRecord>(
	config: SimpleMfaConfig<TStrategies>,
) => createStrategyWrapper<TStrategies>(coerce(config));
