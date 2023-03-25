import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

export const DEFAULT_STRATEGIES = {
	[OtpStrategy.type]: new OtpStrategy(),
	[MagicLinkStrategy.type]: new MagicLinkStrategy(),
};
