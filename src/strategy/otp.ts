import {authenticator, totp} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategy} from '../interfaces/controller.js';

const strategyName = 'otp';

export const OtpStrategy = {
	type: strategyName,
	create(owner_id: string, {generateId}) {
		return {
			id: generateId(),
			owner_id,
			context: `0:${authenticator.generateSecret()}`,
			type: strategyName,
		};
	},
	validate(context, untrustedPayload) {
		const [version, serverSecret] = context.split(':');

		if (version !== '0') {
			throw new StrategyError('Invalid server secret: unknown version', false);
		}

		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		return totp.check(untrustedPayload, serverSecret);
	},
} satisfies AuthStrategy<string>;
