import {totp} from 'otplib';

export function createOtp(secret: string) {
	return totp.generate(secret);
}
