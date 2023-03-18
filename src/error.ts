export class StrategyError extends Error {
	constructor(message: string, public readonly isUserFacing: boolean) {
		super(message);
	}
}
