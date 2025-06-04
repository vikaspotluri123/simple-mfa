// @ts-expect-error importing StrategyError for docs
import type {StrategyError} from '../error.js';
import {type UntypedStrategyRecord} from './config.js';
import {type Public, type MaybePromise, type SerializationResponse} from './shared.js';
import {type SerializedAuthStrategy} from './storage.js';

type NoVoid<T> = T extends void ? never : T;

export type ControllerResponse<
	TStrategies extends UntypedStrategyRecord,
	TMethod extends 'prepare' | 'postValidate',
	Strategy extends keyof TStrategies & string = keyof TStrategies & string,
> = NoVoid<Awaited<ReturnType<TStrategies[Strategy][TMethod]>>>;

export type ValidationResult<TStrategies extends UntypedStrategyRecord> = {
	type: 'serverActionRequired';
	/**
	 * @description a discriminated union (based on `action`) of possible actions to perform with relevant info in `data`
	 */
	response: Public<Awaited<ControllerResponse<TStrategies, 'prepare'>>>;
} | {
	type: 'validationFailed';
	response?: never;
} | {
	type: 'validationSucceeded';
	/**
	 * @description If there were no changes made to the strategy, will be falsy. Otherwise, will contain a new version
	 * of the serialized strategy with the appropriate fields (usually only `context`) updated.
	 */
	response: Public<ControllerResponse<TStrategies, 'postValidate'>> | void;
};

export interface SimpleMfaApiImplementation<
	TStrategies extends UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
	Strategy extends keyof TStrategies & string = keyof TStrategies & string,
	StoredStrategy extends SerializedAuthStrategy<Strategy, TExtraFields> = SerializedAuthStrategy<Strategy, TExtraFields>,
> {
	/**
	 * @description Asserts that a strategy can transition from its current status to {nextStatus}. Primarily used as a
	 * validation mechanism for untrusted inputs
	 *
	 * @throws {StrategyError} when the transition is not allowed
	 */
	assertStatusTransition(storedStrategy: StoredStrategy, nextStatus: StoredStrategy['status']): boolean;
	/**
	 * @description Migrate/generate secrets required by different strategy types
	 * @returns a POJO when changes were made, null if no changes were made
	 * @note This method is not pure; if you call it multiple times, the final secret state will only be returned
	 * on the first call - successive calls will return null.
	 */
	syncSecrets(): Record<string, string> | null; // eslint-disable-line @typescript-eslint/no-restricted-types
	/**
	 * @description creates a {type} strategy for {owner} that can be stored in a database
	 */
	create(type: Strategy, owner: string): Promise<StoredStrategy>;
	/**
	 * @description confirms a strategy can be converted from `pending` to `active` based on a user proof.
	 * @throws {StrategyError} if the strategy is not pending, or is unknown
	 * @note some strategies (e.g. backup codes) use a hard-coded value as a user proof to distinguish between intentional
	 *       activation and unintentional verification. SimpleMfa exposes the constants used by built-in strategies.
	 */
	activate(storedStrategy: StoredStrategy, userPayload: unknown): MaybePromise<boolean>;
	/**
	 * @description confirm "something you have" - does the provided {userPayload} satisfy the requirements of {storedStrategy}?
	 * @note for multi-step verification (e.g. MagicLink), {userPayload} can be a hard-coded constant. SimpleMfa exposes
	 *       the constants used by built-in strategies.
	 * @returns a discriminated union based on `type`, with the details in `response`:
	 *   1. `serverActionRequired`: There is a multi-step process for validation; an action needs to be performed on the
	 *                              server (e.g. send an email). `response` is a discriminated union based on `action` to
	 *                              determine what to do. SimpleMfa exposes actions defined by built-in strategies.
	 *                              Actions are expected to be a globally unique key. SimpleMfa exposes the keys used by
	 *                              built-in strategies as constants. Since SimpleMfa is stateless, you will need to
	 *                              perform validation (e.g. rate-limiting) separately.
	 *   2. `validationFailed`: {userPayload} does not map to a valid value or known constant.
	 *   3. `validationSucceeded`: User has proven something they have. `response` will be a POJO of the updated
	 *      strategy state, or falsy if there was no change to the strategy.
	 */
	validate(storedStrategy: StoredStrategy, userPayload: unknown): Promise<ValidationResult<TStrategies>>;
	/**
	 * @description convert a stored strategy into one that can be public-facing
	 * @param isTrusted - whether the serialization is being done in a trusted context (e.g. a fully logged in user).
	 *                  In trusted contexts, secrets can be made available when applicable.
	 * @note Be ABSOLUTELY CERTAIN to run a stored strategy through the serializer before using it in a public-facing
	 *       context! If you don't, it's possible that internal state can be leaked, and in the worst case, negate
	 *       the point of multi-factor authentication.
	 */
	serialize(storedStrategy: StoredStrategy, isTrusted: boolean): SerializationResponse<Strategy, TExtraFields>;
	/**
	 * @description convert several stored strategies into a public-facing equivalent
	 * @param isTrusted - whether the serialization is being done in a trusted context (e.g. a fully logged in user).
	 *                  In trusted contexts, secrets can be made available when applicable.
	 * @note Be ABSOLUTELY CERTAIN to run all stored strategies through the serializer before using it in a public-facing
	 *       context! If you don't, it's possible that internal state can be leaked, and in the worst case, negate
	 *       the point of multi-factor authentication.
	 */
	serializeAll(strategies: StoredStrategy[], isTrusted: boolean):
	Promise<Array<Awaited<SerializationResponse<Strategy, TExtraFields>>>>;
}

export type SimpleMfaApi<
	TStrategies extends UntypedStrategyRecord = UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
> = Public<SimpleMfaApiImplementation<TStrategies, TExtraFields>>;
