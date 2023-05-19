// @ts-check

import {expect} from 'chai';
import {
	createSimpleMfa,
	MAGIC_LINK_REQUESTING_EMAIL,
	MAGIC_LINK_SERVER_TO_SEND_EMAIL,
	StrategyError,
	BACKUP_CODE_PENDING_TO_ACTIVE_PROOF as ACTIVATE_BACKUP,
} from '../../dist/cjs/index.js';
import {defaultStrategies} from '../../dist/cjs/default-strategies.js';
import {createOtp} from '../../dist/cjs/testing/index.js';
import {MockedCrypto} from '../fixtures/crypto.js';

const instance = createSimpleMfa({
	strategies: defaultStrategies(new MockedCrypto()),
});

/**
 * @template T
 * @param {T} fn
 * @param {Parameters<T extends (...args: any[]) => any ? T : () => void>} args
 */
const shouldThrowStrategyError = async (fn, ...args) => {
	try {
		// @ts-expect-error
		await fn(...args);
	} catch (error) {
		expect(error).to.be.instanceOf(StrategyError);
	}
};

describe('Integration > SimpleMFA', function () {
	it('Strategy coercion', async function () {
		const strategy = await instance.create('otp', 'abcd');
		expect(instance.coerce(strategy)).to.equal(strategy);
		// @ts-expect-error
		strategy.type = 'Does not exist';

		await Promise.all([
			shouldThrowStrategyError(instance.coerce, strategy),
			// @ts-expect-error
			shouldThrowStrategyError(instance.create, 'does not exist'),
			shouldThrowStrategyError(instance.activate, strategy, ''),
			shouldThrowStrategyError(instance.validate, strategy, ''),
			shouldThrowStrategyError(instance.getSecret, strategy),
			shouldThrowStrategyError(instance.serialize, strategy, false),
			shouldThrowStrategyError(instance.serialize, strategy, true),
		]);

		strategy.status = 'active';
		await shouldThrowStrategyError(instance.validate, strategy, '');
	});

	it('OTP Strategy', async function () {
		const otpStore = await instance.create('otp', 'abcd');
		const secret = await instance.getSecret(otpStore);

		if (typeof secret !== 'string') {
			expect(secret, 'type inference').to.be.a('string');
			return;
		}

		const currentToken = createOtp(secret);
		expect(instance.validate(otpStore, currentToken)).to.be.ok;

		expect(await instance.serialize(otpStore, false)).to.not.include.keys('context');
		expect(await instance.serialize(otpStore, true)).to.include.keys('context');

		otpStore.status = 'active';
		expect(await instance.serialize(otpStore, false)).to.not.include.keys('context');
		expect(await instance.serialize(otpStore, true)).to.not.include.keys('context');
	});

	it('MagicLink Strategy', async function () {
		const magicLinkStore = await instance.create('magic-link', 'abcd');
		expect(magicLinkStore.status).to.equal('active');
		expect(await instance.validate(magicLinkStore, '')).to.deep.equal({type: 'validationFailed'});

		const validation = await instance.validate(magicLinkStore, MAGIC_LINK_REQUESTING_EMAIL);

		expect(validation).to.deep.equal({
			type: 'serverActionRequired',
			response: {
				action: MAGIC_LINK_SERVER_TO_SEND_EMAIL,
				data: {
					// @ts-expect-error
					token: validation.response.data.token,
				},
			},
		});

		if (validation.type !== 'serverActionRequired') {
			expect(false, 'type inference error').to.be.true;
			return;
		}

		expect(validation.response.data).to.be.an('object').with.keys(['token']);
		expect(await instance.validate(magicLinkStore, validation.response.data.token)).to.deep.equal({
			type: 'validationSucceeded',
			response: undefined,
		});
	});

	it('BackupCode Strategy', async function () {
		const backupCodesStore = await instance.create('backup-code', 'abcd');
		expect(backupCodesStore.status).to.equal('pending');
		const codes = await instance.getSecret(backupCodesStore);

		if (!Array.isArray(codes)) {
			expect(codes, 'type inference').to.be.an('Array');
			return;
		}

		const realToken = codes[0].replace(/-/g, '');

		await shouldThrowStrategyError(() => instance.validate(backupCodesStore, ''));
		backupCodesStore.status = 'active';
		const currentStrategyStringified = JSON.stringify(backupCodesStore);
		const validation = await instance.validate(backupCodesStore, realToken);

		if (validation.type !== 'validationSucceeded') {
			expect(false, 'type inference').to.be.true;
			return;
		}

		expect(validation).to.deep.contain({type: 'validationSucceeded'});
		expect(validation.response.context).to.be.a('string').and.to.not.equal(currentStrategyStringified);
		expect(await instance.validate(backupCodesStore, realToken)).to.deep.equal({
			type: 'validationFailed',
		});
	});

	it('syncSecrets', async function () {
		const crypto = new MockedCrypto({});
		/** @type {Record<string, string>} */
		const currentState = {};
		instance.syncSecrets(crypto, currentState);
		expect(Object.keys(currentState)).to.deep.equal(['otp', 'magic-link', 'backup-code']);
		// Wait for key imports to complete
		await new Promise(resolve => setTimeout(resolve, 0)); // eslint-disable-line no-promise-executor-return
		expect(crypto.lastUpdateFailed).to.be.false;

		delete currentState.otp;
		const unchangedState = {...currentState};

		instance.syncSecrets(crypto, currentState);
		await new Promise(resolve => setTimeout(resolve, 0)); // eslint-disable-line no-promise-executor-return
		expect(crypto.lastUpdateFailed).to.be.true; // Tried to recreate a key

		expect(Object.keys(currentState)).to.deep.equal(['magic-link', 'backup-code', 'otp']);
		expect(currentState).to.deep.contain(unchangedState);
	});

	it('assertStatusTransition', async function () {
		/**
		 * @typedef {import('../../dist/cjs/interfaces/storage.js').SerializedAuthStrategy<any, any>['status']} Status
		 * @type {(from: Status, to: Status, isAllowed: boolean) => Promise<void>}
		 */
		const assertTransition = async (from, to, isAllowed) => {
			const transition = `${from} -> ${to}`;
			/** @type {import('../../dist/cjs/interfaces/storage.js').SerializedAuthStrategy<any, any>} */
			// @ts-expect-error duck typing
			const mockedStore = {status: from};

			if (isAllowed) {
				expect(() => instance.assertStatusTransition(mockedStore, to), transition).to.not.throw().and.equal(true);
			} else {
				await shouldThrowStrategyError(instance.assertStatusTransition, mockedStore, to);
			}
		};

		await Promise.all([
			assertTransition('active', 'disabled', true),
			assertTransition('active', 'pending', false),
			assertTransition('active', 'active', false),

			assertTransition('pending', 'disabled', false),
			assertTransition('pending', 'pending', false),
			assertTransition('pending', 'active', true),

			assertTransition('disabled', 'disabled', false),
			assertTransition('disabled', 'pending', false),
			assertTransition('disabled', 'active', true),
		]);
	});

	it('activate requires a pending strategy', async function () {
		const backupCodesStore = await instance.create('backup-code', 'abcd');
		expect(backupCodesStore.status).to.equal('pending');
		expect(await instance.activate(backupCodesStore, ACTIVATE_BACKUP)).to.be.ok;
		backupCodesStore.status = 'active';
		shouldThrowStrategyError(instance.activate, backupCodesStore, ACTIVATE_BACKUP);
	});
});
