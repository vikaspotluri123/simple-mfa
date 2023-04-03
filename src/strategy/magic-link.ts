import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {RingMap} from '../utils.js';
import {type StorageService} from '../storage.js';

const TYPE = 'magic-link';
const EXPIRATION_TIME_MS = 36_000_000; // 10 Minutes

const expiredTokens = new RingMap();

let counter = Math.floor(Math.random() * 100);

type MyStrategy = AuthStrategyHelper<void>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

// eslint-disable-next-line @typescript-eslint/ban-types
export class MagicLinkStrategy implements AuthStrategy<void, null, 'email_sent'> {
	static readonly type = TYPE;
	public readonly secretType = 'aes';

	constructor(private readonly _storageService: StorageService) {}

	create(user_id: string, type: string, {generateId}: Config): Strategy {
		const id = generateId();
		return {
			id,
			name: '',
			type,
			status: 'active',
			user_id,
			context: undefined,
		};
	}

	async prepare(strategy: Strategy, config: Config) {
		// `id::expiration::salt`
		const plainTextToken = `${strategy.id}::${Date.now() + EXPIRATION_TIME_MS}::${counter++}`;
		const encryptedToken = await this._storageService.encodeSecret(strategy.type, plainTextToken);
		await config.sendEmail(TYPE, {token: encryptedToken});
		return 'email_sent' as const;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Unable to understand this MagicLink', true);
		}

		if (expiredTokens.has(untrustedPayload)) {
			throw new StrategyError('This MagicLink has already been used', true);
		}

		const decrypted = await this._storageService.decodeSecret(strategy.type, untrustedPayload);
		if (!decrypted) {
			return false;
		}

		const [id, expiration, _] = decrypted.split('::');

		if (id === strategy.id && Number(expiration) > Date.now()) {
			expiredTokens.set(untrustedPayload, undefined);
			return true;
		}

		return false;
	}

	postValidate(_strategy: Strategy, _token: unknown, _config: Config) {
		// Noop
	}

	share(_: Strategy) {
		return null;
	}
}
