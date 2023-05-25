import {SimpleMfaNodeCrypto} from '../../dist/cjs/crypto.js';

const DEFAULT_KEYS = {
	otp: '5375706572447570657253616665416e6453656375726521',
	'magic-link': '5375706572447570657253616665416e6453656375726521',
	'backup-code': '5375706572447570657253616665416e6453656375726521',
};

export class MockedCrypto extends SimpleMfaNodeCrypto {
	/** @type {boolean | null} */
	lastUpdateFailed = null;
	constructor(keys = DEFAULT_KEYS) {
		super(keys);
	}

	/**
	 * @param {any} keyId
	 * @param {any} key64
	 * @returns {Promise<CryptoKey>}
	 */
	async update(keyId, key64) {
		try {
			const response = await super.update(keyId, key64);
			this.lastUpdateFailed = false;
			return response;
		} catch {
			this.lastUpdateFailed = true;
			// @ts-expect-error
			return null;
		}
	}

	__reset() {
		this._keys.clear();
		this.keys = {};
	}
}
