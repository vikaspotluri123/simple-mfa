import {type UntypedStrategyRecord} from './config.js';
import {type Public, type MaybePromise} from './shared.js';
import {type SerializedAuthStrategy} from './storage.js';

type NoVoid<T> = T extends void ? never : T;

export type ControllerResponse<
	TStrategies extends UntypedStrategyRecord,
	TMethod extends 'prepare' | 'postValidate',
	Strategy extends keyof TStrategies & string = keyof TStrategies & string,
> = NoVoid<Awaited<ReturnType<TStrategies[Strategy][TMethod]>>>;

export type ValidationResult<TStrategies extends UntypedStrategyRecord> = {
	type: 'serverActionRequired';
	response: Public<Awaited<ControllerResponse<TStrategies, 'prepare'>>>;
} | {
	type: 'validationFailed';
	response?: never;
} | {
	type: 'validationSucceeded';
	response: Public<ControllerResponse<TStrategies, 'postValidate'>>;
};

// @TODO: allow customization by creating an interface that can be overridden by a consumer
type MinimalStrategy<TStrategy extends string> = Public<
Pick<SerializedAuthStrategy<TStrategy>, 'type' | 'status' | 'context'>
& Partial<SerializedAuthStrategy<TStrategy>
>>;

export interface SimpleMfaApiImplementation<
	TStrategies extends UntypedStrategyRecord,
	Strategy extends keyof TStrategies & string = keyof TStrategies & string,
	StoredStrategy extends MinimalStrategy<Strategy> = MinimalStrategy<Strategy>,
> {
	assertStatusTransition(storedStrategy: StoredStrategy, nextStatus: StoredStrategy['status']): boolean;
	syncSecrets(): Record<string, string> | null; // eslint-disable-line @typescript-eslint/ban-types
	coerce(storedStrategy: SerializedAuthStrategy<string>): StoredStrategy;
	create(type: Strategy, owner: string): MaybePromise<Public<Required<StoredStrategy>>>;
	activate(storedStrategy: StoredStrategy, userPayload: unknown): MaybePromise<boolean>;
	validate(storedStrategy: StoredStrategy, userPayload: unknown): Promise<ValidationResult<TStrategies>>;
	serialize(storedStrategy: StoredStrategy, isTrusted: boolean): MaybePromise<Partial<StoredStrategy>>;
}

export type SimpleMfaApi<TStrategies extends UntypedStrategyRecord = UntypedStrategyRecord> = Public<SimpleMfaApiImplementation<TStrategies>>;
