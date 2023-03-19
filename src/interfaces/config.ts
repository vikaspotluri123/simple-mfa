import {type AuthStrategy} from './controller.js';

export interface CreateSimpleMfaConfig {
	generateId: () => string;
	sendEmail?: (context: string, variables: Record<string, string>) => Promise<void>;
	strategies: Array<AuthStrategy<unknown, unknown>>;
}

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export type StrategyRecord = Record<string, AuthStrategy<unknown, unknown>>;

export interface CoercedConfig {
	strategyConfig: StrategyConfig;
	strategyLut: StrategyRecord;
}
