import {BackupCodeStrategy} from './strategy/backup-code.js';
import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

export function defaultStrategies() {
	return {
		[OtpStrategy.type]: new OtpStrategy(),
		[MagicLinkStrategy.type]: new MagicLinkStrategy(),
		[BackupCodeStrategy.type]: new BackupCodeStrategy(),
	};
}
