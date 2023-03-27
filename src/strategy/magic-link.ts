import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {RingMap} from '../utils.js';
import {type StorageService} from '../storage.js';

const strategyName = 'magic-link';
const EXPIRATION_TIME_MS = 36_000_000; // 10 Minutes

const expiredTokens = new RingMap();

let counter = Math.floor(Math.random() * 100);

type MyStrategy = AuthStrategyHelper<void>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

export class MagicLinkStrategy implements AuthStrategy<void, never, 'email_sent'> {
	static readonly type = strategyName;

	constructor(private readonly _storageService: StorageService) {}

	create(owner_id: string, {generateId}: Config): Strategy {
		const id = generateId();
		return {
			id,
			type: strategyName,
			status: 'active',
			owner_id,
			context: undefined,
		};
	}

	async prepare(strategy: Strategy, config: Config) {
		// `id::expiration::salt`
		const plainTextToken = `${strategy.id}::${Date.now() + EXPIRATION_TIME_MS}::${counter++}`;
		const encryptedToken = await this._storageService.encodeSecret(strategyName, plainTextToken);
		await config.sendEmail(strategyName, {token: encryptedToken});
		return 'email_sent' as const;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Unable to understand this MagicLink', true);
		}

		if (expiredTokens.has(untrustedPayload)) {
			throw new StrategyError('This MagicLink has already been used', true);
		}

		const decrypted = await this._storageService.decodeSecret(strategyName, untrustedPayload);
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

	share(_: Strategy): never {
		throw new StrategyError('MagicLink is not shareable', false);
	}
}
