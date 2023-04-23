// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {totp} from 'otplib';
import {createSimpleMFA, StrategyError} from '../../dist/esm/index.js';
import {defaultStrategies} from '../../dist/esm/default-strategies.js';
import {MockedStorageService} from '../fixtures/storage.js';

const sendEmail = sinon.stub();

const instance = createSimpleMFA({
	strategies: defaultStrategies(new MockedStorageService()),
	sendEmail,
});

/** @type {import('../../dist/esm/interfaces/storage.js').SerializedAuthStrategy[]} */
const mockDatabase = await Promise.all([
	instance.create('otp', 'abcd'),
	instance.create('magic-link', 'abcd'),
	instance.create('otp', 'bcde'),
	instance.create('otp', 'cdef'),
	instance.create('magic-link', 'defg'),
]);

describe('Integration > SimpleMFA', function () {
	it('OTP Strategy', async function () {
		const otpStore = await instance.create('otp', 'abcd');
		const sharedSecret = await instance.share(otpStore);
		const currentToken = totp.generate(sharedSecret);
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

		/** @type {'email_sent'} */
		const response = await instance.prepare(magicLinkStore);

		expect(sendEmail.calledOnce).to.be.true;
		expect(sendEmail.args[0][0]).to.equal('magic-link');
		expect(sendEmail.args[0][1]).to.have.property('token');
		expect(response).to.equal('email_sent');

		expect(await instance.validate(magicLinkStore, sendEmail.args[0][1].token)).to.be.true;
	});

	it('BackupCode Strategy', async function () {
		const backupCodesStore = await instance.create('backup-code', 'abcd');
		expect(backupCodesStore.status).to.equal('active');
		const sharedCodes = await instance.share(backupCodesStore);
		expect(await instance.validate(backupCodesStore, sharedCodes[0].replace(/-/g, ''))).to.be.true;
	});

	it('Valid, but untyped `type` (from storage)', async function () {
		const unsafeStore = mockDatabase.at(Math.floor(Math.random() * mockDatabase.length));

		// Type safety
		if (!unsafeStore) {
			expect(false).to.be.true;
			return;
		}

		const store = instance.coerce(unsafeStore);

		/** @type {'email_sent' | void} */
		const prepareResponse = await instance.prepare(store);

		expect(prepareResponse === undefined || prepareResponse === 'email_sent').to.be.true;
		expect(await instance.validate(store, '')).to.be.false;
	});

	it('syncSecrets', async function () {
		const storageService = new MockedStorageService({});
		/** @type {Record<string, string>} */
		const currentState = {};
		instance.syncSecrets(storageService, currentState);
		expect(Object.keys(currentState)).to.deep.equal(['otp', 'magic-link', 'backup-code']);
		// Wait for key imports to complete
		await new Promise(resolve => setTimeout(resolve, 0)); // eslint-disable-line no-promise-executor-return
		expect(storageService.lastUpdateFailed).to.be.false;

		delete currentState.otp;
		const unchangedState = {...currentState};

		instance.syncSecrets(storageService, currentState);
		await new Promise(resolve => setTimeout(resolve, 0)); // eslint-disable-line no-promise-executor-return
		expect(storageService.lastUpdateFailed).to.be.true; // Tried to recreate a key

		expect(Object.keys(currentState)).to.deep.equal(['magic-link', 'backup-code', 'otp']);
		expect(currentState).to.deep.contain(unchangedState);
	});

	it('assertStatusTransition', function () {
		/**
		 * @typedef {typeof mockDatabase[number]['status']} Status
		 * @type {(from: Status, to: Status, isAllowed: boolean) => void}
		 */
		const assertTransition = (from, to, isAllowed) => {
			// @ts-expect-error duck typing
			const deferredTransition = () => instance.assertStatusTransition({status: from}, to);
			const expectAssertion = expect(deferredTransition, `${from} -> ${to}`);

			if (isAllowed) {
				expectAssertion.to.not.throw().and.equal(true);
			} else {
				expectAssertion.to.throw(StrategyError);
			}
		};

		assertTransition('active', 'disabled', true);
		assertTransition('active', 'pending', false);
		assertTransition('active', 'active', false);

		assertTransition('pending', 'disabled', false);
		assertTransition('pending', 'pending', false);
		assertTransition('pending', 'active', true);

		assertTransition('disabled', 'disabled', false);
		assertTransition('disabled', 'pending', false);
		assertTransition('disabled', 'active', true);
	});
});
