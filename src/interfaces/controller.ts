import {type StrategyConfig} from './config.js';
import {type MaybePromise} from './shared.js';
import {type SerializedAuthStrategy} from './storage.js';

export interface PrepareResponse {
	type: string;
	data: unknown;
}

export interface AuthStrategy<
	TAuthContext,
	TSharedConfig,
	TPrepareResponse extends string | PrepareResponse | undefined,
	TStrategies extends string = string,
	TInternalStrategy = SerializedAuthStrategy<TStrategies, TAuthContext>,
> {
	readonly secretType?: 'none' | 'aes';
	/**
	 * @description
	 * Create a globally unique strategy for the specific user
	 */
	create: (owner: string, type: string, config: StrategyConfig) => MaybePromise<TInternalStrategy>;
	/**
	 * @description
	 * After the user selects to authenticate with this strategy, perform an action and respond with context
	 * This isn't required in many scenarios, and can default to a noop.
	 */
	prepare: (strategy: TInternalStrategy, untrustedPayload: unknown, config: StrategyConfig) => MaybePromise<TPrepareResponse>;
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
	/**
	 * @description
	 * Convert the private stored data into an api-compatible format
	 *  - remove sensitive data
	 *  - decrypt data if required
	 * If a serializer is not provided, a default serializer is used - the store is cloned, and `context` is removed
	 */
	serialize?: (strategy: Readonly<TInternalStrategy>, isTrusted: boolean, share: this['share']) => MaybePromise<Partial<TInternalStrategy>>;
}

export interface AuthStrategyHelper<TAuthContext> {
	config: StrategyConfig;
	strategy: SerializedAuthStrategy<string, TAuthContext>;
}
