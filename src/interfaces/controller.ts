import {type StrategyConfig} from './config.js';
import {type SerializedAuthStrategy} from './storage.js';

export interface AuthStrategy<TAuthContext> {
	type: SerializedAuthStrategy<any>['type'];
	create: (owner: string, config: StrategyConfig) => SerializedAuthStrategy<TAuthContext>;
	validate: (context: TAuthContext, untrustedPayload: unknown) => boolean | Promise<boolean>;
}

export type AuthStrategyValidator = (
	strategy: SerializedAuthStrategy<unknown>, untrustedPayload: unknown
) => Promise<boolean>;
