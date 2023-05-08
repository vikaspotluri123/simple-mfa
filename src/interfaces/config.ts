import {type MaybePromise} from './shared.js';
import {type AuthStrategy} from './controller.js';

export type UntypedStrategyRecord = Record<string, AuthStrategy<any, any, any>>;

declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface SimpleMfaEmailParameters {}
}

export interface CreateSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	generateId: () => string;
	sendEmail: <TMessageType extends keyof SimpleMfaEmailParameters>(
		context: TMessageType,
		variables: SimpleMfaEmailParameters[TMessageType]
	) => MaybePromise<void>;
	strategies: TStrategies;
}

export type SimpleMfaConfig<
	TStrategies = UntypedStrategyRecord,
	TConfig extends CreateSimpleMfaConfig<TStrategies> = CreateSimpleMfaConfig<TStrategies>,
> = Partial<TConfig> & Required<Pick<TConfig, 'strategies'>>;

export type StrategyConfig = Required<Omit<CreateSimpleMfaConfig, 'strategies'>>;

export interface InternalSimpleMfaConfig<TStrategies = UntypedStrategyRecord> {
	config: StrategyConfig;
	strategies: Required<TStrategies>;
}
