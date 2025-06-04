import {type StrategyConfig} from './config.js';
import {type SerializationResponse, type MaybePromise} from './shared.js';
import {type MinimalAuthStrategy, type SerializedAuthStrategy} from './storage.js';

export interface PrepareResponse {
	action: string;
	data: unknown;
}

export type AllowedPrepareType = string | PrepareResponse;

export interface AuthStrategy<
	TStoredContextDefinition,
	TParsedSecretType,
	TPrepareType extends AllowedPrepareType = never,
	TStrategyNames extends string = string,
	TExtraFields extends Record<string, any> | void = void,
	TInternalStrategy = SerializedAuthStrategy<TStrategyNames, TExtraFields, TStoredContextDefinition>,
> {
	readonly secretType?: 'none' | 'aes';
	/**
	 * @description
	 * Create a globally unique strategy for the specific user
	 */
	create: (owner: string, type: string, config: StrategyConfig) => MaybePromise<MinimalAuthStrategy<TStrategyNames, TStoredContextDefinition>>;
	/**
	 * @description
	 * After the user selects to authenticate with this strategy, perform an action and respond with context
	 * This isn't required in many scenarios, and can default to a noop.
	 */
	prepare: (strategy: TInternalStrategy, untrustedPayload: unknown, config: StrategyConfig) => MaybePromise<TPrepareType | undefined> | void;
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
	MaybePromise<TInternalStrategy | undefined> | void;
	/**
	 * @description
	 * Convert the private stored data into a user-specific public version
	 */
	getSecret: (strategy: TInternalStrategy, config: StrategyConfig) => MaybePromise<TParsedSecretType>;
	/**
	 * @description
	 * Convert the private stored data into an api-compatible format
	 *  - remove sensitive data
	 *  - decrypt data if required
	 * If a serializer is not provided, a default serializer is used - the store is cloned, and `context` is removed
	 */
	serialize?: (strategy: Readonly<TInternalStrategy>, isTrusted: boolean, getSecret: this['getSecret'], config: StrategyConfig) =>
	SerializationResponse<TStrategyNames, TExtraFields, TStoredContextDefinition>;
}

export interface AuthStrategyHelper<TAuthContext> {
	config: StrategyConfig;
	createdStrategy: MinimalAuthStrategy<string, TAuthContext>;
	strategy: SerializedAuthStrategy<string, void, TAuthContext>;
}
