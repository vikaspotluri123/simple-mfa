import {type PublicAuthStrategy} from './storage.js';

export type MaybePromise<T> = T | Promise<T>;

export type Public<TToFlatten> = {
	[K in keyof TToFlatten]: TToFlatten[K];
// eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type SerializationResponse<
	TTypes extends string,
	TExtraFields extends Record<string, any> | void = void,
	TContext = any,
> = MaybePromise<PublicAuthStrategy<TTypes, TExtraFields, TContext>>;
