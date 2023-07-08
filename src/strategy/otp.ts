import {authenticator} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

const decryptionCache = new WeakMap<Strategy, string>();

export class OtpStrategy implements AuthStrategy<string, string> {
	static readonly type = 'otp';
	public readonly secretType = 'aes';

	async create(user_id: string, type: string, {generateId, crypto}: Config): Promise<Strategy> {
		const plainText = authenticator.generateSecret();
		const context = await crypto.encodeSecret('otp', plainText);
		const strategy: Strategy = {
			id: generateId(),
			name: '',
			status: 'pending',
			priority: null,
			user_id,
			context,
			type,
		};

		decryptionCache.set(strategy, plainText);
		return strategy;
	}

	prepare(_strategy: Strategy, _untrustedPayload: unknown, _config: Config) {
		return undefined;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, config: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		const serverMemorySecret = await this._decode(strategy, config);

		if (!serverMemorySecret) {
			return false;
		}

		return authenticator.check(untrustedPayload, serverMemorySecret);
	}

	postValidate(_strategy: Strategy, _otp: unknown, _config: Config) {
		// Noop
	}

	async getSecret(strategy: Strategy, config: Config) {
		const decoded = await this._decode(strategy, config);

		if (!decoded) {
			throw new StrategyError('Unable to extract secret', false);
		}

		return decoded;
	}

	private async _decode(strategy: Strategy, {crypto}: Config) {
		if (decryptionCache.has(strategy)) {
			return decryptionCache.get(strategy);
		}

		const plainText = await crypto.decodeSecret(OtpStrategy.type, strategy.context);
		if (!plainText) {
			return null;
		}

		decryptionCache.set(strategy, plainText);
		return plainText;
	}
}
