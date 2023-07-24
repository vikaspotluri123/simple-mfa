/**
 * @description An auth strategy (second factor) that was returned by the Strategy controller. Only contains
 * fields that are required by SimpleMfa/universally necessary.
 */
export interface MinimalAuthStrategy<TTypes extends string, TContext = any> {
	id: string;
	user_id: string;
	type: TTypes;
	status: 'pending' | 'active' | 'disabled';
	context: TContext;
}

/**
 * @description An auth strategy (second factor) that can be committed to/read from storage. Contains
 * SimpleMfa required fields as well as any additional fields required by your application.
 */
export type SerializedAuthStrategy<
	TTypes extends string,
	TExtraFields extends Record<string, any> | void = void,
	TContext = any,
> =
	MinimalAuthStrategy<TTypes, TContext> & (TExtraFields extends void ? unknown : TExtraFields);

/**
 * @description An auth strategy (second factor) with the secret data either completely removed
 *  (e.g. for untrusted contexts) or converted to plain text (e.g. for activation)
 */
export type PublicAuthStrategy<
	TTypes extends string,
	TExtraFields extends Record<string, any> | void = void,
	TContext = any,
> =
	Omit<SerializedAuthStrategy<TTypes, TExtraFields, TContext>, 'context'>
	& {context?: TContext};
