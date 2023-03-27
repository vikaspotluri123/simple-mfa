import {type StrategyConfig} from './config.js';
import {type SerializedAuthStrategy} from './storage.js';

export type MaybePromise<T> = T | Promise<T>;

export interface AuthStrategy<
	TAuthContext,
	TSharedConfig,
	TPrepareResponse extends string | void,
	TStrategies extends string = string,
	TInternalStrategy = SerializedAuthStrategy<TStrategies, TAuthContext>,
> {
	/**
	 * @description
	 * Create a globally unique strategy for the specific user
	 */
	create: (owner: string, config: StrategyConfig) => MaybePromise<TInternalStrategy>;
	/**
	 * @description
	 * After the user selects to authenticate with this strategy, perform an action and respond with context
	 * This isn't required in many scenarios, and can default to a noop.
	 */
	prepare: (strategy: TInternalStrategy, config: StrategyConfig) => MaybePromise<TPrepareResponse>;
	/**
	 * @description
	 * Authenticate the user using this strategy based on the data they provided
	 */
	validate: (strategy: TInternalStrategy, untrustedPayload: unknown, config: StrategyConfig) => MaybePromise<boolean>;
	/**
	 * @description
	 * After a successful validation, perform a mutation to the stored data
	 */
	postValidate: (strategy: TInternalStrategy, payload: unknown, config: StrategyConfig) =>
	MaybePromise<TInternalStrategy | void>;
	/**
	 * @description
	 * Convert the private stored data into a user-specific public version
	 */
	share: (strategy: TInternalStrategy) => MaybePromise<TSharedConfig>;
}

export interface AuthStrategyHelper<TAuthContext> {
	config: StrategyConfig;
	strategy: SerializedAuthStrategy<string, TAuthContext>;
}
