import {type SimpleMfaCrypto} from './interfaces/crypto.js';
import {BackupCodeStrategy} from './strategy/backup-code.js';
import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

export function defaultStrategies(crypto: SimpleMfaCrypto) {
	return {
		[OtpStrategy.type]: new OtpStrategy(crypto),
		[MagicLinkStrategy.type]: new MagicLinkStrategy(crypto),
		[BackupCodeStrategy.type]: new BackupCodeStrategy(crypto),
	};
}
