import {StrategyError} from './error.js';
import {type UntypedStrategyRecord, type InternalSimpleMfaConfig} from './interfaces/config.js';
import {type MaybePromise, type AuthStrategy} from './interfaces/controller.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

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

	return {
		create<TStrategy extends Strategy>(type: TStrategy, owner: string) {
			const strategy = strategies[type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.create(owner, config) as NarrowSerializedFromStrategy<TStrategies[TStrategy], TStrategy & string>;
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

		share<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy, string>) {
			const strategy = strategies[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return strategy.share(storedStrategy) as ShareType<TStrategies[TStrategy]>;
		},
	};
}
