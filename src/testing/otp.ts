import {authenticator} from 'otplib';

export function createOtp(secret: string) {
	return authenticator.generate(secret);
}
