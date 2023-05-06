export function getOtpUri(
	issuer: string,
	account: string,
	secret: string,
	label = issuer,
) {
	const safeSecret = secret.replace(/\D/g, '').toUpperCase();
	return `otpauth://totp/${encodeURI(label)}:${encodeURI(account)}?secret=${safeSecret}&issuer=${encodeURI(issuer)}`;
}
