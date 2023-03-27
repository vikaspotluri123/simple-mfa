import {StorageService} from '../../dist/storage.js';

export class MockedStorageService extends StorageService {
	constructor() {
		super({
			otp: 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
			'magic-link': 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
			'backup-code': 'U3VwZXJEdXBlclNhZmVBbmRTZWN1cmUh',
		});
	}
}
