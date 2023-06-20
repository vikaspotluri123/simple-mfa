import {RingMap} from '../../utils.js';
import {type MaybePromise} from '../../interfaces/shared.js';
import {StrategyError} from '../../public-api.js';
import {type Config, type Strategy} from '../../interfaces/magic-link.js';

export interface TokenStore {
	create(strategy: Strategy, crypto: Config['crypto']): MaybePromise<string>;
	validate(strategy: Strategy, crypto: Config['crypto'], token: string): MaybePromise<boolean>;
}

export class DefaultTokenStore implements TokenStore {
	static EXPIRATION_TIME_MS = 36_000_000; // 10 Minutes
	private _sequence = Math.floor(Math.random() * 100);
	private readonly _expiredTokens = new RingMap();

	async create(strategy: Strategy, crypto: Config['crypto']) {
		// `id::expiration::salt`
		const plainTextToken = `${strategy.id}::${Date.now() + DefaultTokenStore.EXPIRATION_TIME_MS}::${this._sequence++}`;
		return crypto.encodeSecret(strategy.type, plainTextToken);
	}

	async validate(strategy: Strategy, crypto: Config['crypto'], token: string) {
		if (this._expiredTokens.has(token)) {
			throw new StrategyError('This MagicLink has already been used', true);
		}

		const decrypted = await crypto.decodeSecret(strategy.type, token);
		if (!decrypted) {
			return false;
		}

		const [id, expiration, _] = decrypted.split('::');

		if (id === strategy.id && Number(expiration) > Date.now()) {
			this._expiredTokens.set(token, undefined);
			return true;
		}

		return false;
	}
}
