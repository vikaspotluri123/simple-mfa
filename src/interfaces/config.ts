import {type AuthStrategy} from './controller.js';

export type UntypedStrategyRecord = Record<string, AuthStrategy<any, any>>;

export interface CreateSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	generateId: () => string;
	sendEmail?: (context: string, variables: Record<string, string>) => Promise<void>;
	strategies: TStrategies;
}

export type SimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TConfig extends CreateSimpleMfaConfig<TStrategies> = CreateSimpleMfaConfig<TStrategies>,
> = Partial<TConfig> & Required<Pick<TConfig, 'strategies'>>;

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export interface CoercedConfig<TStrategies = UntypedStrategyRecord> {
	strategyConfig: StrategyConfig;
	strategies: TStrategies;
}
