import {BACKUP_CODE_PENDING_TO_ACTIVE_PROOF} from '../constants.js';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';
import {type StorageService} from '../storage.js';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

const decryptionCache = new WeakMap<Strategy, string[]>();

export class BackupCodeStrategy implements AuthStrategy<string, string[]> {
	static readonly type = 'backup-code';
	public readonly secretType = 'aes';
	constructor(private readonly _storage: StorageService, private readonly countToCreate = 10) {}

	async create(user_id: string, type: string, {generateId}: Config): Promise<Strategy> {
		const codes: string[] = Array.from({length: this.countToCreate});
		for (const [index, _] of codes.entries()) {
			const untrimmedCode = Array.from(this._storage.generateSecret(12)).join('');
			const trimmedCode = untrimmedCode.length === 12 ? untrimmedCode : untrimmedCode.slice(1, 13);
			codes[index] = trimmedCode;
		}

		const response: Strategy = {
			id: generateId(),
			name: '',
			user_id,
			status: 'pending',
			priority: null,
			type,
			context: '',
		};

		await this._serialize(response, codes);
		return response;
	}

	prepare(_strategy: Strategy, _untrustedPayload: unknown, _config: Config) {
		return undefined;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, _config: Config) {
		if (strategy.status === 'pending') {
			return untrustedPayload === BACKUP_CODE_PENDING_TO_ACTIVE_PROOF;
		}

		const codes = await this._deserialize(strategy);
		return typeof untrustedPayload === 'string' && codes.includes(untrustedPayload);
	}

	async postValidate(strategy: Strategy, expiredCode: unknown, _config: Config) {
		let codes = await this._deserialize(strategy);
		codes = codes.filter(maybeExpiredCode => expiredCode !== maybeExpiredCode);
		// @TODO: how do we trigger code regeneration?
		return this._serialize(strategy, codes);
	}

	async share(strategy: Strategy) {
		const codes = await this._deserialize(strategy);
		return codes.map(code => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
	}

	private async _serialize(strategy: Strategy, codes: string[]) {
		const serializedCodes = codes.join('|');
		const existingSerializedCodes = decryptionCache.get(strategy)?.join('|');
		if (existingSerializedCodes === serializedCodes) {
			return;
		}

		decryptionCache.set(strategy, codes);
		strategy.context = await this._storage.encodeSecret(strategy.type, serializedCodes);
		return strategy;
	}

	private async _deserialize(strategy: Strategy) {
		const cached = decryptionCache.get(strategy);
		if (cached) {
			return cached;
		}

		const decrypted = await this._storage.decodeSecret(strategy.type, strategy.context);
		if (!decrypted) {
			throw new StrategyError('Failed deserializing context', false);
		}

		const deserialized = decrypted.split('|');
		decryptionCache.set(strategy, deserialized);
		return deserialized;
	}
}
