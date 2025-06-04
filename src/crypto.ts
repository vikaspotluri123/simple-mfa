import {Buffer} from 'node:buffer';
import {webcrypto} from 'node:crypto';
import {type SimpleMfaCrypto} from './interfaces/crypto.js';

const KEY_USAGES: ['encrypt', 'decrypt'] = ['encrypt', 'decrypt'];
const ALGORITHM = 'AES-GCM';

const IV_BYTE_LENGTH = 16;
const ENCODED_IV_LENGTH = IV_BYTE_LENGTH * 2; // Initialization Vector is encoded in hex, 2 characters make up 1 byte

const IV_ENCODING = 'hex';
const CYPHER_ENCODING = 'base64';
const TEXT_ENCODING = 'utf8';
const KEY_ENCODING = 'hex';

Object.freeze(KEY_USAGES);

/* c8 ignore next 7 */
function isomorphicStructuredClone(value: unknown): any {
	if ('structuredClone' in globalThis) {
		return structuredClone(value);
	}

	return JSON.parse(JSON.stringify(value)); // eslint-disable-line unicorn/prefer-structured-clone
}

export class SimpleMfaNodeCrypto<TKeyType extends string = string> implements SimpleMfaCrypto<TKeyType> {
	private readonly _keys: Map<string, CryptoKey | Promise<CryptoKey>>;

	constructor(private readonly keys: Record<TKeyType, string>, private readonly crypto = webcrypto) {
		this._keys = new Map();
		for (const [keyId, key] of Object.entries<string>(keys)) {
			this._keys.set(keyId, this._importKey(keyId as TKeyType, key));
		}
	}

	getCurrentKeys() {
		return isomorphicStructuredClone(this.keys) as Record<TKeyType, string>;
	}

	async update(keyId: TKeyType, key64: string) {
		if (this._keys.has(keyId)) {
			throw new Error('overriding keys is not supported');
		}

		this.keys[keyId] = key64;
		return this._importKey(keyId, key64);
	}

	async decodeSecret(keyId: TKeyType, encryptedValue: string) {
		// NOTE: We intentionally allow key retrieval to throw an exception - if we're not able to get the key,
		// it's a big issue that shouldn't be suppressed.
		const key = await this._keys.get(keyId)!;
		const iv = encryptedValue.slice(0, ENCODED_IV_LENGTH);
		const cypher = encryptedValue.slice(ENCODED_IV_LENGTH);

		try {
			const binaryPlainText = await this.crypto.subtle.decrypt(
				{name: ALGORITHM, iv: Buffer.from(iv, IV_ENCODING)},
				key,
				Buffer.from(cypher, CYPHER_ENCODING),
			);
			return Buffer.from(binaryPlainText).toString(TEXT_ENCODING);
		} catch {
			return null;
		}
	}

	async encodeSecret(keyId: TKeyType, plainText: string) {
		const key = await this._keys.get(keyId)!;
		const iv = this.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
		const cypher = await this.crypto.subtle.encrypt(
			{name: 'AES-GCM', iv},
			key,
			Buffer.from(plainText, TEXT_ENCODING),
		);

		return `${Buffer.from(iv).toString(IV_ENCODING)}${Buffer.from(cypher).toString(CYPHER_ENCODING)}`;
	}

	generateSecret(bytes: number) {
		const response = new Uint8Array(bytes);
		return this.crypto.getRandomValues(response);
	}

	generateSecretEncoded(bytes: number) {
		return Buffer.from(this.generateSecret(bytes)).toString(KEY_ENCODING);
	}

	private async _importKey(keyId: TKeyType, key64: string): Promise<CryptoKey> {
		const importedKey = this.crypto.subtle.importKey(
			'raw', Buffer.from(key64, KEY_ENCODING), {name: ALGORITHM}, true, KEY_USAGES,
		).then(key => { // eslint-disable-line promise/prefer-await-to-then
			this._keys.set(keyId, key);
			return key;
		});

		this._keys.set(keyId, importedKey);
		return importedKey;
	}
}
