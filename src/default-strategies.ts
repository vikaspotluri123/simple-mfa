import {type AuthStrategy} from './interfaces/controller.js';
import {OtpStrategy} from './strategy/otp.js';

export const DEFAULT_STRATEGIES: Array<AuthStrategy<any, any>> = [
	OtpStrategy,
];
