import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {type StorageService} from '../storage.js';

const strategyName = 'backup-code';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

export class BackupCodeStrategy implements AuthStrategy<string, string, void> {
	readonly type = strategyName;
	constructor(private readonly _storage: StorageService, private readonly countToCreate = 10) {}

	async create(owner_id: string, {generateId}: Config): Promise<Strategy[]> {
		const response: Array<Promise<Strategy>> = Array.from({length: this.countToCreate});
		for (const [index, _] of response.entries()) {
			response[index] = this._createSingle(owner_id, generateId);
		}

		return Promise.all(response);
	}

	prepare(_strategy: Strategy, _config: Config) {
		// Noop
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		const decoded = await this._storage.decodeSecret(strategyName, strategy.context);
		return typeof untrustedPayload === 'string' && decoded === untrustedPayload;
	}

	postValidate(_strategy: Strategy, _code: unknown, _config: Config) {
		// Noop
	}

	async share(strategy: Strategy) {
		const decoded = await this._storage.decodeSecret('backup-code', strategy.context);

		if (!decoded) {
			throw new StrategyError('Failed to decrypt code', false);
		}

		return `${decoded.slice(0, 4)}-${decoded.slice(4, 8)}-${decoded.slice(8)}`;
	}

	private async _createSingle(owner_id: string, generateId: Config['generateId']): Promise<Strategy> {
		const untrimmedCode = Array.from(this._storage.generateSecret(12)).join('');

		const trimmedCode = untrimmedCode.length === 12 ? untrimmedCode : untrimmedCode.slice(1, 13);

		return {
			id: generateId(),
			status: 'active',
			owner_id,
			context: await this._storage.encodeSecret(strategyName, trimmedCode),
			type: strategyName,
		};
	}
}
