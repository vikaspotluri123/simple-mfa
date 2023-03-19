import {Buffer} from 'node:buffer';
import crypto, {type webcrypto} from 'node:crypto';
import {type StrategyConfig} from './interfaces/config.js';
import {StrategyError} from './error.js';

export const textEncoder = new TextEncoder();

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

export class RingMap<TValue> {
	private readonly _lookupStore = new Map<string, TValue>();
	private readonly _keyStore: string[];
	private _currentIndex = 0;

	constructor(private readonly size = 100) {
		this._keyStore = Array.from({length: size});
	}

	set(element: string, value: TValue) {
		const currentResident = this._keyStore[this._currentIndex];
		if (currentResident !== undefined) {
			this._lookupStore.delete(currentResident);
		}

		this._lookupStore.set(element, value);
		this._keyStore[this._currentIndex] = element;
		this._currentIndex = (this._currentIndex + 1) % this.size;
	}

	has(element: string) {
		return this._lookupStore.has(element);
	}

	get(element: string) {
		return this._lookupStore.get(element);
	}
}

const keys = new RingMap<CryptoKey>();

async function getKey(rawKey: string, importKey: typeof webcrypto.subtle.importKey) {
	if (keys.has(rawKey)) {
		return keys.get(rawKey)!;
	}

	const key = await importKey(
		'raw', textEncoder.encode(rawKey), {name: 'AES-GCM'}, true, ['encrypt', 'decrypt'],
	);
	keys.set(rawKey, key);
	return key;
}

export async function encryptString(key: string, text: string, config: StrategyConfig) {
	const iv = crypto.randomBytes(16);
	const binaryEncryptedPayload = await config.encrypt(
		{name: 'AES-GCM', iv},
		await getKey(key, config.importKey),
		textEncoder.encode(text),
	);

	return `${Buffer.from(iv).toString('hex')}:${Buffer.from(binaryEncryptedPayload).toString('hex')}`;
}

export async function decryptString(key: string, encrypted: string, config: StrategyConfig) {
	const [textIv, payload] = encrypted.split(':', 2);

	if (!textIv || !payload) {
		throw new StrategyError('Invalid encrypted payload', false);
	}

	const binaryDecryptedPayload = await config.decrypt(
		{name: 'AES-GCM', iv: new Uint8Array(Buffer.from(textIv, 'hex'))},
		await getKey(key, config.importKey),
		Buffer.from(payload, 'hex'),
	);

	return Buffer.from(binaryDecryptedPayload).toString('utf8');
}
