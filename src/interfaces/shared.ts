export type MaybePromise<T> = T | Promise<T>;

export type Public<TToFlatten> = {
	[K in keyof TToFlatten]: TToFlatten[K];
// eslint-disable-next-line @typescript-eslint/ban-types
} & {};
