export class StrategyError extends Error {
	constructor(message: string, public readonly isUserFacing: boolean, options?: {cause: any}) {
		super(message, options);
	}
}
