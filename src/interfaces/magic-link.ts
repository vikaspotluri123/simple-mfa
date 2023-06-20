import type {AuthStrategyHelper} from '../public-api.js';

export type MyStrategy = AuthStrategyHelper<void>;
export type Strategy = MyStrategy['strategy'];
export type Config = MyStrategy['config'];
