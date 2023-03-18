import {coerce} from './config.js';
import {type CreateSimpleMfaConfig} from './interfaces/config.js';
import {createStrategyWrapper} from './wrapper.js';

export const createSimpleMFA = (config: Partial<CreateSimpleMfaConfig>) => createStrategyWrapper(coerce(config));
