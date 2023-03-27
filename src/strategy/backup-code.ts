import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {type StorageService} from '../storage.js';

const strategyName = 'backup-code';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

const decryptionCache = new WeakMap<Strategy, string[]>();

export class BackupCodeStrategy implements AuthStrategy<string, string[], void> {
	readonly type = strategyName;
	constructor(private readonly _storage: StorageService, private readonly countToCreate = 10) {}

	async create(owner_id: string, {generateId}: Config): Promise<Strategy> {
		const codes: string[] = Array.from({length: this.countToCreate});
		for (const [index, _] of codes.entries()) {
			const untrimmedCode = Array.from(this._storage.generateSecret(12)).join('');
			const trimmedCode = untrimmedCode.length === 12 ? untrimmedCode : untrimmedCode.slice(1, 13);
			codes[index] = trimmedCode;
		}

		const response: Strategy = {
			id: generateId(),
			owner_id,
			status: 'active',
			type: strategyName,
			context: '',
		};

		return this._serialize(response, codes);
	}

	prepare(_strategy: Strategy, _config: Config) {
		// Noop
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		const codes = await this._deserialize(strategy);
		return typeof untrustedPayload === 'string' && codes.includes(untrustedPayload);
	}

	async postValidate(strategy: Strategy, expiredCode: unknown, _config: Config) {
		let codes = await this._deserialize(strategy);
		codes = codes.filter(maybeExpiredCode => expiredCode === maybeExpiredCode);
		// @TODO: how do we trigger code regeneration?
		return this._serialize(strategy, codes);
	}

	async share(strategy: Strategy) {
		const codes = await this._deserialize(strategy);
		return codes.map(code => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
	}

	private async _serialize(strategy: Strategy, codes: string[]) {
		decryptionCache.set(strategy, codes);
		strategy.context = await this._storage.encodeSecret(strategyName, codes.join('|'));
		return strategy;
	}

	private async _deserialize(strategy: Strategy) {
		const cached = decryptionCache.get(strategy);
		if (cached) {
			return cached;
		}

		const decrypted = await this._storage.decodeSecret(strategyName, strategy.context);
		if (!decrypted) {
			throw new StrategyError('Failed deserializing context', false);
		}

		const deserialized = decrypted.split('|');
		decryptionCache.set(strategy, deserialized);
		return deserialized;
	}
}