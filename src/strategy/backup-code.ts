import {BACKUP_CODE_PENDING_TO_ACTIVE_PROOF} from '../constants.js';
import {StrategyError} from '../error.js';
import {type AuthStrategyHelper, type AuthStrategy} from '../interfaces/controller.js';

type MyStrategy = AuthStrategyHelper<string>;
type Strategy = MyStrategy['strategy'];
type Config = MyStrategy['config'];

const decryptionCache = new WeakMap<Strategy, string[]>();

export class BackupCodeStrategy implements AuthStrategy<string, string[]> {
	static readonly type = 'backup-code';
	public readonly secretType = 'aes';
	constructor(private readonly countToCreate = 10) {}

	async create(user_id: string, type: string, config: Config): Promise<Strategy> {
		const codes: string[] = Array.from({length: this.countToCreate});
		for (const [index, _] of codes.entries()) {
			const untrimmedCode = Array.from(config.crypto.generateSecret(12)).join('');
			const trimmedCode = untrimmedCode.length === 12 ? untrimmedCode : untrimmedCode.slice(1, 13);
			codes[index] = trimmedCode;
		}

		const response: Strategy = {
			id: config.generateId(),
			name: '',
			user_id,
			status: 'pending',
			priority: null,
			type,
			context: '',
		};

		await this._serialize(response, codes, config);
		return response;
	}

	prepare(_strategy: Strategy, _untrustedPayload: unknown, _config: Config) {
		return undefined;
	}

	async validate(strategy: Strategy, untrustedPayload: unknown, config: Config) {
		if (strategy.status === 'pending') {
			return untrustedPayload === BACKUP_CODE_PENDING_TO_ACTIVE_PROOF;
		}

		const codes = await this._deserialize(strategy, config);
		return typeof untrustedPayload === 'string' && codes.includes(untrustedPayload);
	}

	async postValidate(strategy: Strategy, expiredCode: unknown, config: Config) {
		let codes = await this._deserialize(strategy, config);
		codes = codes.filter(maybeExpiredCode => expiredCode !== maybeExpiredCode);
		// @TODO: how do we trigger code regeneration?
		return this._serialize(strategy, codes, config);
	}

	async getSecret(strategy: Strategy, config: Config) {
		const codes = await this._deserialize(strategy, config);
		return codes.map(code => `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
	}

	private async _serialize(strategy: Strategy, codes: string[], {crypto}: Config) {
		const serializedCodes = codes.join('|');
		const existingSerializedCodes = decryptionCache.get(strategy)?.join('|');
		if (existingSerializedCodes === serializedCodes) {
			return;
		}

		decryptionCache.set(strategy, codes);
		strategy.context = await crypto.encodeSecret(strategy.type, serializedCodes);
		return strategy;
	}

	private async _deserialize(strategy: Strategy, {crypto}: Config) {
		const cached = decryptionCache.get(strategy);
		if (cached) {
			return cached;
		}

		const decrypted = await crypto.decodeSecret(strategy.type, strategy.context);
		if (!decrypted) {
			throw new StrategyError('Failed deserializing context', false);
		}

		const deserialized = decrypted.split('|');
		decryptionCache.set(strategy, deserialized);
		return deserialized;
	}
}
