import {type StorageService} from '../storage.js';
import {type UntypedStrategyRecord} from './config.js';
import {type MaybePromise} from './shared.js';
import {type SerializedAuthStrategy} from './storage.js';

export interface SimpleMfaApi<
	TStrategies extends UntypedStrategyRecord,
	Strategy extends keyof TStrategies & string = keyof TStrategies & string,
	StoredStrategy extends SerializedAuthStrategy<Strategy> = SerializedAuthStrategy<Strategy>,
> {
	assertStatusTransition(storedStrategy: StoredStrategy, nextStatus: StoredStrategy['status']): boolean;
	syncSecrets(storageService: StorageService, store?: Record<string, string>): Record<string, string>;
	coerce(storedStrategy: SerializedAuthStrategy<string>): StoredStrategy;
	create(type: Strategy, owner: string): MaybePromise<StoredStrategy>;
	prepare(storedStrategy: StoredStrategy, userPayload: unknown): Promise<ReturnType<TStrategies[Strategy]['prepare']>>;
	validate(storedStrategy: StoredStrategy, userPayload: unknown): MaybePromise<boolean>;
	postValidate(storedStrategy: StoredStrategy, userPayload: unknown): MaybePromise<StoredStrategy | undefined> | void;
	share(storedStrategy: StoredStrategy): ReturnType<TStrategies[Strategy]['share']>;
	serialize(storedStrategy: StoredStrategy, isTrusted: boolean): MaybePromise<Partial<StoredStrategy>>;
}
