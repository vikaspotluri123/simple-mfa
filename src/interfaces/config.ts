import {type webcrypto} from 'node:crypto';
import {type AuthStrategy} from './controller.js';

export interface CreateSimpleMfaConfig {
	generateId: () => string;
	sendEmail?: (context: string, variables: Record<string, string>) => Promise<void>;
	importKey?: typeof webcrypto.subtle.importKey;
	encrypt?: typeof webcrypto.subtle.encrypt;
	decrypt?: typeof webcrypto.subtle.decrypt;
	strategies: Array<AuthStrategy<unknown, unknown>>;
}

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export type StrategyRecord = Record<string, AuthStrategy<unknown, unknown>>;

export interface CoercedConfig {
	strategyConfig: StrategyConfig;
	strategyLut: StrategyRecord;
}
