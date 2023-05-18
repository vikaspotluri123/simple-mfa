/* eslint-disable @typescript-eslint/promise-function-async */
import {StrategyError} from './error.js';
import {type UntypedStrategyRecord, type InternalSimpleMfaConfig} from './interfaces/config.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';
import {type StorageService} from './storage.js';
import {type SimpleMfaApi} from './interfaces/wrapper.js';

export function createStrategyWrapper<TStrategies extends UntypedStrategyRecord>(
	internalConfig: InternalSimpleMfaConfig<TStrategies>,
) {
	const {config, strategies} = internalConfig;

	type Strategy = keyof TStrategies & string;
	type StoredStrategy = SerializedAuthStrategy<Strategy>;

	const wrapper: SimpleMfaApi<TStrategies> = {
		assertStatusTransition(storedStrategy: StoredStrategy, nextStatus: StoredStrategy['status']) {
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

		coerce(storedStrategy: StoredStrategy): StoredStrategy {
			if (storedStrategy.type in strategies) {
				return storedStrategy;
			}

			throw new StrategyError('Invalid strategy', false);
		},

		create(type: Strategy, owner: string) {
			const controller = strategies[type];
			if (!controller) {
				throw new StrategyError(`Invalid type: ${type}`, true);
			}

			return controller.create(owner, type, config);
		},

		prepare(storedStrategy: StoredStrategy, userPayload: unknown) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return strategy.prepare(storedStrategy, userPayload, config);
		},

		validate(storedStrategy: StoredStrategy, userPayload: unknown) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.validate(storedStrategy, userPayload, config);
		},

		postValidate(storedStrategy: StoredStrategy, payload: unknown) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.postValidate(storedStrategy, payload, config);
		},

		share(storedStrategy: StoredStrategy) {
			const controller = strategies[storedStrategy.type];
			if (!controller) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return controller.share(storedStrategy);
		},

		serialize(storedStrategy: StoredStrategy, isTrusted: boolean) {
			const controller = strategies[storedStrategy.type];
			if (!controller) {
				throw new StrategyError('Invalid strategy', false);
			}

			return controller.serialize!(storedStrategy, isTrusted, wrapper.share);
		},
	};

	return wrapper;
}
