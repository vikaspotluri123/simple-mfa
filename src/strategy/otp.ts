import {authenticator, totp} from 'otplib';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {type StorageService} from '../storage.js';

const strategyName = 'otp';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

export class OtpStrategy implements AuthStrategy<string, string, void> {
	static readonly type = strategyName;
	#lastDecryptedSecretCypher?: string;
	#lastDecryptedSecretPlain?: string;

	constructor(private readonly _storageService: StorageService) {}

	async create(owner_id: string, {generateId}: Config): Promise<Strategy> {
		const plainText = authenticator.generateSecret();
		const context = await this._storageService.encodeSecret('otp', plainText);
		this.#lastDecryptedSecretPlain = plainText;
		this.#lastDecryptedSecretCypher = context;

		return {
			id: generateId(),
			status: 'pending',
			owner_id,
			context,
			type: strategyName,
		};
	}

	prepare(_strategy: Strategy, _config: Config) {
		// Noop
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Invalid client payload', true);
		}

		const serverMemorySecret = await this._decode(strategy.context);

		return totp.check(untrustedPayload, serverMemorySecret);
	}

	// eslint-disable-next-line @typescript-eslint/promise-function-async
	share(strategy: Strategy) {
		return this._decode(strategy.context);
	}

	private async _decode(secret: string) {
		if (this.#lastDecryptedSecretCypher === secret) {
			return this.#lastDecryptedSecretPlain!;
		}

		const plainText = await this._storageService.decodeSecret(OtpStrategy.type, secret);
		this.#lastDecryptedSecretCypher = secret;
		this.#lastDecryptedSecretPlain = plainText;
		return plainText;
	}
}
