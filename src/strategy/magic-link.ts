import {StrategyError} from '../error.js';
import {type AuthStrategy} from '../interfaces/controller.js';
import {MAGIC_LINK_REQUESTING_EMAIL, MAGIC_LINK_SERVER_TO_SEND_EMAIL} from '../constants.js';
import {type Config, type Strategy, type NewStrategy} from '../interfaces/magic-link.js';
import {DefaultTokenStore, type TokenStore} from './_magic-link/token-store.js';

export {type TokenStore} from './_magic-link/token-store.js';

// See `constants.ts` for const assertion context
const TYPE = 'magic-link' as const; // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion

export interface MagicLinkPrepareResponse {
	action: typeof MAGIC_LINK_SERVER_TO_SEND_EMAIL;
	data: {
		token: string;
	};
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class MagicLinkStrategy implements AuthStrategy<void, null, MagicLinkPrepareResponse> {
	static readonly type = TYPE;
	public readonly secretType = 'aes';
	private readonly _tokens: TokenStore;

	constructor(tokenStore?: TokenStore | undefined) {
		this._tokens = tokenStore ?? new DefaultTokenStore();
	}

	create(user_id: string, type: string, {generateId}: Config): NewStrategy {
		const id = generateId();
		return {
			id,
			type,
			status: 'active',
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
		const encryptedToken = await this._tokens.create(strategy, crypto);
		return {action: MAGIC_LINK_SERVER_TO_SEND_EMAIL, data: {token: encryptedToken}};
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, {crypto}: Config) {
		if (typeof untrustedPayload !== 'string') {
			throw new StrategyError('Unable to understand this MagicLink', true);
		}

		return this._tokens.validate(strategy, crypto, untrustedPayload);
	}

	postValidate(_strategy: Strategy, _token: unknown, _config: Config) {
		// Noop
	}

	getSecret(_: Strategy) {
		return null;
	}
}
