/* eslint-disable @typescript-eslint/promise-function-async */
import {StrategyError} from './error.js';
import {type UntypedStrategyRecord, type InternalSimpleMfaConfig} from './interfaces/config.js';
import {type SerializationResponse} from './interfaces/shared.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';
import {type ControllerResponse, type SimpleMfaApi} from './interfaces/wrapper.js';

export function createStrategyWrapper<
	TStrategies extends UntypedStrategyRecord,
	TExtraFields extends Record<string, any> | void = void,
>(
	internalConfig: InternalSimpleMfaConfig<TStrategies, TExtraFields>,
) {
	const {config, strategies, customStoredFields} = internalConfig;

	type Strategy = keyof TStrategies & string;
	type StoredStrategy = SerializedAuthStrategy<Strategy, TExtraFields>;

	const wrapper: SimpleMfaApi<TStrategies, TExtraFields> = {
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

		syncSecrets() {
			const secrets = config.crypto.getCurrentKeys();
			let returnSecrets = false;
			for (const [strategyType, strategy] of Object.entries(strategies)) {
				if (
					(strategy as TStrategies[Strategy]).secretType === 'aes'
					&& !Object.hasOwnProperty.call(secrets, strategyType)
				) {
					returnSecrets = true;
					const secret = config.crypto.generateSecretEncoded(32);
					secrets[strategyType] = secret;
					void config.crypto.update(strategyType, secret);
				}
			}

			return returnSecrets ? secrets : null;
		},

		activate(storedStrategy: StoredStrategy, userPayload: unknown) {
			if (storedStrategy.status !== 'pending') {
				throw new StrategyError('Strategy must be pending to activate', true);
			}

			const controller = strategies[storedStrategy.type];
			if (!controller) {
				throw new StrategyError('Invalid strategy', false);
			}

			return controller.validate(storedStrategy, userPayload, config);
		},

		coerce(storedStrategy: StoredStrategy): StoredStrategy {
			if (storedStrategy.type in strategies) {
				return storedStrategy;
			}

			throw new StrategyError('Invalid strategy', false);
		},

		async create(type: Strategy, owner: string) {
			const controller = strategies[type];
			if (!controller) {
				throw new StrategyError(`Invalid type: ${type}`, true);
			}

			const strategy = {
				...(await controller.create(owner, type, config)),
				...customStoredFields,
			};

			return strategy as StoredStrategy;
		},

		async validate(storedStrategy: StoredStrategy, userPayload: unknown) {
			if (storedStrategy.status !== 'active') {
				throw new StrategyError('Inactive strategies cannot be used for verification', true);
			}

			const controller = strategies[storedStrategy.type];
			if (!controller) {
				throw new StrategyError('Invalid strategy', false);
			}

			type Prepared = ControllerResponse<TStrategies, 'prepare'>;
			const prepared = await controller.prepare(storedStrategy, userPayload, config) as Awaited<Prepared>;

			if (prepared) {
				return {
					type: 'serverActionRequired',
					response: prepared,
				};
			}

			const validated = await controller.validate(storedStrategy, userPayload, config);

			if (!validated) {
				return {type: 'validationFailed'};
			}

			type PostValidated = ControllerResponse<TStrategies, 'postValidate'>;
			const postValidated = await controller.postValidate(storedStrategy, userPayload, config) as PostValidated;

			return {
				type: 'validationSucceeded',
				response: postValidated,
			};
		},

		serialize(storedStrategy: StoredStrategy, isTrusted: boolean) {
			const controller = strategies[storedStrategy.type];
			if (!controller) {
				throw new StrategyError('Invalid strategy', false);
			}

			return controller.serialize!(storedStrategy, isTrusted, controller.getSecret, config) as SerializationResponse<Strategy, TExtraFields>;
		},
	};

	return wrapper;
}
