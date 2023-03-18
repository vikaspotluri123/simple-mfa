import {type AuthStrategy} from './controller.js';

export interface CreateSimpleMfaConfig {
	generateId: () => string;
	sendEmail?: (variables: Record<string, string>) => Promise<void>;
	strategies: Array<AuthStrategy<unknown, unknown>>;
}

export type StrategyConfig = Pick<CreateSimpleMfaConfig, 'generateId'>;

export type StrategyRecord = Record<string, AuthStrategy<unknown, unknown>>;

export interface CoercedConfig {
	strategyConfig: StrategyConfig;
	strategyLut: StrategyRecord;
}
