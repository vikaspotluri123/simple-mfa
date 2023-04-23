import {StrategyError} from './error.js';
import {type UntypedStrategyRecord, type InternalSimpleMfaConfig} from './interfaces/config.js';
import {type MaybePromise, type AuthStrategy} from './interfaces/controller.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';
import {type StorageService} from './storage.js';

type NarrowSerializedFromStrategy<TStrategy extends AuthStrategy<any, any, any>, TNarrowStrategies extends string> =
	TStrategy extends AuthStrategy<infer AuthContext, any, any>
		? SerializedAuthStrategy<TNarrowStrategies, AuthContext>
		: never;

type ShareType<TStrategy extends AuthStrategy<any, any, any>> =
	TStrategy extends AuthStrategy<any, infer ShareContext, any> ? ShareContext : never;

type PrepareType<TStrategy extends AuthStrategy<any, any, any>> =
	TStrategy extends AuthStrategy<any, any, infer Prepare> ? Prepare : never;

export function createStrategyWrapper<TStrategies extends UntypedStrategyRecord>(
	internalConfig: InternalSimpleMfaConfig<TStrategies>,
) {
	const {config, strategies} = internalConfig;

	type Strategy = keyof TStrategies;

	const wrapper = {
		assertStatusTransition(storedStrategy: SerializedAuthStrategy<any>, nextStatus: SerializedAuthStrategy<any>['status']) {
			const {status: currentStatus} = storedStrategy;
			if (
				// CASE: transitioning to the current status doesn't make any sense
				currentStatus !== nextStatus
				&& (
					// CASE: active is only not allowed to transition to pending
					(currentStatus === 'active' && nextStatus !== 'pending')
					// CASE: disabled is only not allowed to transition to pending
					|| (currentStatus === 'disabled' && nextStatus !== 'pending')
					// CASE: pending is only not allowed to transition to disabled
					|| (currentStatus === 'pending' && nextStatus !== 'disabled')
				)
			) {
				return true;
			}

			throw new StrategyError(`Cannot change status from ${currentStatus} to ${nextStatus}`, true);
		},

		syncSecrets(storageService: StorageService, store: Record<string, string> = {}) {
			for (const [strategyType, strategy] of Object.entries(strategies)) {
				if (
					(strategy as TStrategies[Strategy]).secretType === 'aes'
					&& !Object.hasOwnProperty.call(store, strategyType)
				) {
					store[strategyType] = storageService.generateSecretEncoded(32);
					void storageService.update(strategyType, store[strategyType]);
				}
			}

			return store;
		},

		coerce(storedStrategy: SerializedAuthStrategy<any>): SerializedAuthStrategy<Strategy & string> {
			if (storedStrategy.type in strategies) {
				return storedStrategy as SerializedAuthStrategy<Strategy & string>;
			}

			throw new StrategyError('Invalid strategy', false);
		},

		create<TStrategy extends Strategy & string>(type: TStrategy, owner: string) {
			const strategy = strategies[type];
			if (!strategy) {
				throw new StrategyError(`Invalid type: ${type}`, true);
			}

			return strategy.create(owner, type, config) as MaybePromise<NarrowSerializedFromStrategy<TStrategies[TStrategy], TStrategy & string>>;
		},

		prepare<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy>) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return strategy.prepare(storedStrategy, config) as MaybePromise<PrepareType<TStrategies[TStrategy]>>;
		},

		validate<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy>, userPayload: unknown) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.validate(storedStrategy, userPayload, config);
		},

		postValidate<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy>, payload: unknown) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.postValidate(storedStrategy, payload, config);
		},

		share<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy, string>) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return strategy.share(storedStrategy) as MaybePromise<ShareType<TStrategies[TStrategy]>>;
		},

		serialize<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy, string>, isTrusted: boolean) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.serialize!(storedStrategy, isTrusted, wrapper.share);
		},
	};

	return wrapper;
}
