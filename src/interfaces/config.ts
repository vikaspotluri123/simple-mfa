import {type AllowedPrepareType, type AuthStrategy} from './controller.js';
import {type SimpleMfaCrypto} from './crypto.js';

export type UntypedStrategyRecord = Record<string, AuthStrategy<any, any, AllowedPrepareType>>;

export interface CreateSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	generateId: () => string;
	strategies: TStrategies;
	crypto: SimpleMfaCrypto;
}

export type SimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TConfig extends CreateSimpleMfaConfig<TStrategies> = CreateSimpleMfaConfig<TStrategies>,
> = Partial<TConfig> & Required<Pick<TConfig, 'strategies' | 'crypto'>>;

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export interface InternalSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	config: StrategyConfig;
	strategies: Required<TStrategies>;
}
