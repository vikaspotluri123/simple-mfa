import {type StorageService} from './storage.js';
import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

export function defaultStrategies(storageService: StorageService) {
	return {
		[OtpStrategy.type]: new OtpStrategy(storageService),
		[MagicLinkStrategy.type]: new MagicLinkStrategy(),
	};
}
