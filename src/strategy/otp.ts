import {authenticator, totp} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {type StorageService} from '../storage.js';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

export class OtpStrategy implements AuthStrategy<string, string, undefined> {
	static readonly type = 'otp';
	public readonly secretType = 'aes';
	#lastDecryptedSecretCypher?: string;
	#lastDecryptedSecretPlain?: string;

	constructor(private readonly _storageService: StorageService) {}

	async create(user_id: string, type: string, {generateId}: Config): Promise<Strategy> {
		const plainText = authenticator.generateSecret();
		const context = await this._storageService.encodeSecret('otp', plainText);
		this.#lastDecryptedSecretPlain = plainText;
		this.#lastDecryptedSecretCypher = context;

		return {
			id: generateId(),
			name: '',
			status: 'pending',
			priority: null,
			user_id,
			context,
			type,
		};
	}

	prepare(_strategy: Strategy, _untrustedPayload: unknown, _config: Config) {
		return undefined;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		const serverMemorySecret = await this._decode(strategy.context);

		if (!serverMemorySecret) {
			return false;
		}

		return totp.check(untrustedPayload, serverMemorySecret);
	}

	postValidate(_strategy: Strategy, _otp: unknown, _config: Config) {
		// Noop
	}

	async share(strategy: Strategy) {
		const decoded = await this._decode(strategy.context);

		if (!decoded) {
			throw new StrategyError('Unable to extract secret', false);
		}

		return decoded;
	}

	private async _decode(secret: string) {
		if (this.#lastDecryptedSecretCypher === secret) {
			return this.#lastDecryptedSecretPlain!;
		}

		const plainText = await this._storageService.decodeSecret(OtpStrategy.type, secret);
		if (!plainText) {
			return null;
		}

		this.#lastDecryptedSecretCypher = secret;
		this.#lastDecryptedSecretPlain = plainText;
		return plainText;
	}
}
