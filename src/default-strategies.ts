import {BackupCodeStrategy} from './strategy/backup-code.js';
import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

interface DefaultSimpleMfaStrategies {
	[OtpStrategy.type]: OtpStrategy;
	[MagicLinkStrategy.type]: MagicLinkStrategy;
	[BackupCodeStrategy.type]: BackupCodeStrategy;
}

export function defaultStrategies(overrides: Partial<DefaultSimpleMfaStrategies> = {}) {
	return {
		[OtpStrategy.type]: overrides[OtpStrategy.type] ?? new OtpStrategy(),
		[MagicLinkStrategy.type]: overrides[MagicLinkStrategy.type] ?? new MagicLinkStrategy(),
		[BackupCodeStrategy.type]: overrides[BackupCodeStrategy.type] ?? new BackupCodeStrategy(),
	};
}
