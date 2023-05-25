import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {RingMap} from '../utils.js';
import {type MaybePromise} from '../interfaces/shared.js';
import {MAGIC_LINK_REQUESTING_EMAIL, MAGIC_LINK_SERVER_TO_SEND_EMAIL} from '../constants.js';

const TYPE = 'magic-link' as const;
const EXPIRATION_TIME_MS = 36_000_000; // 10 Minutes

let expiredTokens: RingMap<string>;

const defaultTokenStore = () => {
	expiredTokens ??= new RingMap();
	return expiredTokens;
};

export interface TokenExpiryStore {
	get(token: string): MaybePromise<string | undefined>;
	has(token: string): MaybePromise<boolean>;
	set(token: string, value: string | undefined): MaybePromise<void>;
}

export interface MagicLinkPrepareResponse {
	action: typeof MAGIC_LINK_SERVER_TO_SEND_EMAIL;
	data: {
		token: string;
	};
}

let counter = Math.floor(Math.random() * 100);

type MyStrategy = AuthStrategyHelper<void>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

// eslint-disable-next-line @typescript-eslint/ban-types
export class MagicLinkStrategy implements AuthStrategy<void, null, MagicLinkPrepareResponse> {
	static readonly type = TYPE;
	public readonly secretType = 'aes';
	private readonly _expiredTokens: TokenExpiryStore;

	constructor(tokenStore = defaultTokenStore()) {
		this._expiredTokens = tokenStore;
	}

	create(user_id: string, type: string, {generateId}: Config): Strategy {
		const id = generateId();
		return {
			id,
			name: '',
			type,
			status: 'active',
			priority: null,
			user_id,
			context: undefined,
		};
	}

	async prepare(strategy: Strategy, untrustedPayload: unknown, {crypto}: Config) {
		// CASE: This is not a request to send an email --> proceed to validation stage
		if (untrustedPayload !== MAGIC_LINK_REQUESTING_EMAIL) {
			return undefined;
		}

		// `id::expiration::salt`
		const plainTextToken = `${strategy.id}::${Date.now() + EXPIRATION_TIME_MS}::${counter++}`;
		const encryptedToken = await crypto.encodeSecret(strategy.type, plainTextToken);
		return {action: MAGIC_LINK_SERVER_TO_SEND_EMAIL, data: {token: encryptedToken}};
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, {crypto}: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Unable to understand this MagicLink', true);
		}

		if (await this._expiredTokens.has(untrustedPayload)) {
			throw new StrategyError('This MagicLink has already been used', true);
		}

		const decrypted = await crypto.decodeSecret(strategy.type, untrustedPayload);
		if (!decrypted) {
			return false;
		}

		const [id, expiration, _] = decrypted.split('::');

		if (id === strategy.id && Number(expiration) > Date.now()) {
			await this._expiredTokens.set(untrustedPayload, undefined);
			return true;
		}

		return false;
	}

	postValidate(_strategy: Strategy, _token: unknown, _config: Config) {
		// Noop
	}

	getSecret(_: Strategy) {
		return null;
	}
}
