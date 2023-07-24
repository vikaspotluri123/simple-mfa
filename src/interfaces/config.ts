import {type AllowedPrepareType, type AuthStrategy} from './controller.js';
import {type SimpleMfaCrypto} from './crypto.js';

export type UntypedStrategyRecord = Record<string, AuthStrategy<any, any, AllowedPrepareType>>;

export interface CreateSimpleMfaConfig<TStrategies = UntypedStrategyRecord, TExtraFields = never> {
	generateId: () => string;
	strategies: TStrategies;
	crypto: SimpleMfaCrypto;
	customStoredFields?: TExtraFields;
}

export type SimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
	TConfig extends CreateSimpleMfaConfig<TStrategies, TExtraFields> = CreateSimpleMfaConfig<TStrategies, TExtraFields>,
> = Partial<TConfig> & Pick<TConfig, 'strategies' | 'crypto' | 'customStoredFields'>;

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies' | 'customStoredFields'>>;

export interface InternalSimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
> {
	config: StrategyConfig;
	strategies: Required<TStrategies>;
	customStoredFields?: TExtraFields;
}
