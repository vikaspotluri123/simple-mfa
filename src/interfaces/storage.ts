
export interface SerializedAuthStrategy<TContext> {
	id: string;
	owner_id: string;
	type: 'otp' | 'magic-link' | 'web-authn';
	status: 'pending' | 'active' | 'disabled';
	context: TContext;
}
