import {StrategyError} from './error.js';
import {type UntypedStrategyRecord, type CoercedConfig} from './interfaces/config.js';
import {type AuthStrategy} from './interfaces/controller.js';
import {type SerializedAuthStrategy} from './interfaces/storage.js';

type NarrowSerializedFromStrategy<TStrategy extends AuthStrategy<any, any>, TNarrowStrategies extends string> =
	TStrategy extends AuthStrategy<infer AuthContext, any>
		? SerializedAuthStrategy<TNarrowStrategies, AuthContext>
		: never;

type ShareType<TStrategy extends AuthStrategy<any, any>> =
	TStrategy extends AuthStrategy<any, infer ShareContext> ? ShareContext : never;

export function createStrategyWrapper<TStrategies extends UntypedStrategyRecord>(config: CoercedConfig<TStrategies>) {
	const {strategyConfig, strategies: strategyLut} = config;

	type Strategy = keyof TStrategies;

	return {
		create<TStrategy extends Strategy>(type: TStrategy, owner: string) {
			const strategy = strategyLut[type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.create(owner, strategyConfig) as NarrowSerializedFromStrategy<TStrategies[TStrategy], TStrategy & string>;
		},

		prepare<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy>) {
			const strategy = strategyLut[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.prepare(storedStrategy, strategyConfig);
		},

		validate<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy>, userPayload: unknown) {
			const strategy = strategyLut[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			return strategy.validate(storedStrategy, userPayload, strategyConfig);
		},

		share<TStrategy extends Strategy & string>(storedStrategy: SerializedAuthStrategy<TStrategy, string>) {
			const strategy = strategyLut[storedStrategy.type];
			if (!strategy) {
				throw new StrategyError('Invalid strategy', false);
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return strategy.share(storedStrategy) as ShareType<TStrategies[TStrategy]>;
		},
	};
}
