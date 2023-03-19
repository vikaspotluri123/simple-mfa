import {authenticator} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategy} from '../interfaces/controller.js';
import {RingMap, decryptString, encryptString} from '../utils.js';

const strategyName = 'magic-link';
const EXPIRATION_TIME_MS = 36_000_000; // 10 Minutes

const expiredTokens = new RingMap();

let counter = Math.floor(Math.random() * 100);

export const MagicLinkStrategy = {
	type: strategyName,
	create(owner_id: string, {generateId}) {
		const id = generateId();
		return {
			id,
			type: strategyName,
			status: 'active',
			owner_id,
			context: authenticator.generateSecret(),
		};
	},
	async prepare(strategy, config) {
		// `id::expiration::salt`
		const plainTextToken = `${strategy.id}::${Date.now() + EXPIRATION_TIME_MS}::${counter++}`;
		const encryptedToken = await encryptString(strategy.context, plainTextToken, config);
		await config.sendEmail(strategyName, {token: encryptedToken});
		return 'email_sent';
	},
	async validate(strategy, untrustedPayload, config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Unable to understand this MagicLink', true);
		}

		if (expiredTokens.has(untrustedPayload)) {
			throw new StrategyError('This MagicLink has already been used', true);
		}

		const decryptedToken = await decryptString(strategy.context, untrustedPayload, config);
		const [id, expiration, _] = decryptedToken.split('::');

		if (id === strategy.id && Number(expiration) > Date.now()) {
			expiredTokens.set(untrustedPayload, undefined);
			return true;
		}

		return false;
	},
	share(_) {
		throw new StrategyError('MagicLink is not shareable', false);
	},
} satisfies AuthStrategy<string, 0>;
