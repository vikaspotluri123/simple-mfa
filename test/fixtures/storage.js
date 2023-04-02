import {StorageService} from '../../dist/esm/storage.js';

const DEFAULT_KEYS = {
	otp: 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
	'magic-link': 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
	'backup-code': 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
};

export class MockedStorageService extends StorageService {
	lastUpdateFailed = null;
	/** @param {Record<string, string>} keys */
	constructor(keys = DEFAULT_KEYS) {
		super(keys);
	}

	/** @returns {Promise<CryptoKey>} */
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
}
