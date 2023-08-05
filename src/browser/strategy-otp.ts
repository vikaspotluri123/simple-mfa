export function getOtpUri(
	issuer: string,
	account: string,
	secret: string,
	label = issuer,
) {
	// https://docs.yubico.com/yesdk/users-manual/application-oath/uri-string-format.html
	// > The issuer and account name should be separated by a literal or url-encoded colon, and optional spaces may precede the account name. Neither issuer nor account name may themselves contain a colon.
	const safeLabel = label.replaceAll(':', '-');
	const safeAccount = account.replaceAll(':', '-');
	const safeSecret = secret.toUpperCase();
	const extras = new URLSearchParams();
	extras.set('secret', safeSecret);
	extras.set('issuer', issuer);
	return `otpauth://totp/${encodeURI(safeLabel)}:${encodeURI(safeAccount)}?${extras.toString()}`;
}
