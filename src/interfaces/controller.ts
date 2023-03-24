import {type StrategyConfig} from './config.js';
import {type SerializedAuthStrategy} from './storage.js';

type MaybePromise<T> = T | Promise<T>;

export interface AuthStrategy<TAuthContext, TSharedConfig> {
	/**
	 * @description
	 * A unique slug to identify this strategy. This is stored in the database and used as a lookup key.
	 */
	type: SerializedAuthStrategy<any>['type'];
	/**
	 * @description
	 * Create a globally unique strategy for the specific user
	 */
	create: (owner: string, config: StrategyConfig) => SerializedAuthStrategy<TAuthContext>;
	/**
	 * @description
	 * After the user selects to authenticate with this strategy, perform an action and respond with context
	 * This isn't required in many scenarios, and can default to a noop.
	 */
	prepare: (strategy: SerializedAuthStrategy<TAuthContext>, config: StrategyConfig) => MaybePromise<void | string>;
	/**
	 * @description
	 * Authenticate the user using this strategy based on the data they provided
	 */
	validate: (strategy: SerializedAuthStrategy<TAuthContext>, untrustedPayload: unknown, config: StrategyConfig) => MaybePromise<boolean>;
	/**
	 * @description
	 * Convert the private stored data into a user-specific public version
	 */
	share: (strategy: SerializedAuthStrategy<TAuthContext>) => TSharedConfig;
}

export interface AuthStrategyHelper<TAuthContext> {
	config: StrategyConfig;
	strategy: SerializedAuthStrategy<TAuthContext>;
}

export type AuthStrategyValidator = (
	strategy: SerializedAuthStrategy<unknown>, untrustedPayload: unknown
) => Promise<boolean>;
