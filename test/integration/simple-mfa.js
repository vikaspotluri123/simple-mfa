// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {totp} from 'otplib';
import {createSimpleMFA} from '../../dist/index.js';
import {DEFAULT_STRATEGIES} from '../../dist/default-strategies.js';

const sendEmail = sinon.stub();

const instance = createSimpleMFA({
	strategies: DEFAULT_STRATEGIES,
	sendEmail,
});

/** @type {import('../../dist/interfaces/storage.js').SerializedAuthStrategy[]} */
const mockDatabase = [
	instance.create('otp', 'abcd'),
	instance.create('magic-link', 'abcd'),
	instance.create('otp', 'bcde'),
	instance.create('otp', 'cdef'),
	instance.create('magic-link', 'defg'),
];

describe('Integration > SimpleMFA', function () {
	it('OTP Strategy', function () {
		const otpStore = instance.create('otp', 'abcd');
		const sharedSecret = instance.share(otpStore);
		const currentToken = totp.generate(sharedSecret);
		expect(instance.validate(otpStore, currentToken)).to.be.ok;
	});

	it('MagicLink Strategy', async function () {
		const magicLinkStore = instance.create('magic-link', 'abcd');
		/** @type {'email_sent'} */
		const response = await instance.prepare(magicLinkStore);

		expect(sendEmail.calledOnce).to.be.true;
		expect(sendEmail.args[0][0]).to.equal('magic-link');
		expect(sendEmail.args[0][1]).to.have.property('token');
		expect(response).to.equal('email_sent');

		expect(await instance.validate(magicLinkStore, sendEmail.args[0][1].token)).to.be.true;
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
});
