import {authenticator, totp} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';

const strategyName = 'otp';

function stripVersion(context: string) {
	const [version, serverSecret] = context.split(':');

	if (version !== '0') {
		throw new StrategyError('Invalid server secret: unknown version', false);
	}

	return serverSecret;
}

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

export class OtpStrategy implements AuthStrategy<string, string> {
	static readonly type = strategyName;

	create(owner_id: string, {generateId}: Config): Strategy {
		return {
			id: generateId(),
			status: 'pending',
			owner_id,
			context: `0:${authenticator.generateSecret()}`,
			type: strategyName,
		};
	}

	prepare(_strategy: Strategy, _config: Config) {
		// Noop
	}

	validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		const serverSecret = stripVersion(strategy.context);

		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		return totp.check(untrustedPayload, serverSecret);
	}

	share(strategy: Strategy) {
		return stripVersion(strategy.context);
	}
}
