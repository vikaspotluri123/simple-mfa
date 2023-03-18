
export interface SerializedAuthStrategy<TContext> {
	id: string;
	owner_id: string;
	type: 'otp' | 'magic-link' | 'web-authn';
	context: TContext;
}
