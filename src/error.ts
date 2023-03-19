export class StrategyError extends Error {
	constructor(message: string, public readonly isUserFacing: boolean, options?: {cause: any}) {
		// @ts-expect-error Error constructor supports `{cause}` as second param in newer versions, older versions
		// silently ignore
		super(message, options);
	}
}
