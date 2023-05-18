import {type AllowedPrepareType, type AuthStrategy} from './controller.js';

export type UntypedStrategyRecord = Record<string, AuthStrategy<any, any, AllowedPrepareType>>;

export interface CreateSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	generateId: () => string;
	strategies: TStrategies;
}

export type SimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TConfig extends CreateSimpleMfaConfig<TStrategies> = CreateSimpleMfaConfig<TStrategies>,
> = Partial<TConfig> & Required<Pick<TConfig, 'strategies'>>;

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export interface InternalSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	config: StrategyConfig;
	strategies: Required<TStrategies>;
}
