import {type webcrypto} from 'node:crypto';
import {type MaybePromise} from './shared.js';

export interface SimpleMfaCrypto<TKeyType extends string = string> {
	getCurrentKeys(): Record<TKeyType, string>;
	update(key: TKeyType, key64: string): MaybePromise<webcrypto.CryptoKey>;
	// eslint-disable-next-line @typescript-eslint/no-restricted-types
	decodeSecret(key: TKeyType, encryptedValue: string): MaybePromise<string | null>;
	encodeSecret(key: TKeyType, plainText: string): MaybePromise<string>;
	generateSecret(bytes: number): Uint8Array;
	generateSecretEncoded(bytes: number): string;
}
