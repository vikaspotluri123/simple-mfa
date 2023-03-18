import {type StrategyConfig} from './config.js';
import {type SerializedAuthStrategy} from './storage.js';

export interface AuthStrategy<TAuthContext, TSharedConfig> {
	type: SerializedAuthStrategy<any>['type'];
	create: (owner: string, config: StrategyConfig) => SerializedAuthStrategy<TAuthContext>;
	validate: (context: TAuthContext, untrustedPayload: unknown) => boolean | Promise<boolean>;
	share: (strategy: SerializedAuthStrategy<TAuthContext>) => TSharedConfig;
}

export type AuthStrategyValidator = (
	strategy: SerializedAuthStrategy<unknown>, untrustedPayload: unknown
) => Promise<boolean>;
