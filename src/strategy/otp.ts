import {authenticator, totp} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategy} from '../interfaces/controller.js';
import {noop} from '../utils.js';

const strategyName = 'otp';

function stripVersion(context: string) {
	const [version, serverSecret] = context.split(':');

	if (version !== '0') {
		throw new StrategyError('Invalid server secret: unknown version', false);
	}

	return serverSecret;
}

export const OtpStrategy = {
	type: strategyName,
	create(owner_id: string, {generateId}) {
		return {
			id: generateId(),
			status: 'pending',
			owner_id,
			context: `0:${authenticator.generateSecret()}`,
			type: strategyName,
		};
	},
	prepare: noop,
	validate(context, untrustedPayload) {
		const serverSecret = stripVersion(context);

		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		return totp.check(untrustedPayload, serverSecret);
	},
	share(strategy) {
		return stripVersion(strategy.context);
	},
} satisfies AuthStrategy<string, string>;
