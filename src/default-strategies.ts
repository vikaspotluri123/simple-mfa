import {type AuthStrategy} from './interfaces/controller.js';
import {MagicLinkStrategy} from './strategy/magic-link.js';
import {OtpStrategy} from './strategy/otp.js';

export const DEFAULT_STRATEGIES: Array<AuthStrategy<any, any>> = [
	new OtpStrategy(),
	new MagicLinkStrategy(),
];
