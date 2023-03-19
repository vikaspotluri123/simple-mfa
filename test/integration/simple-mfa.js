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

describe('Integration > SimpleMFA', function () {
	it('OTP Strategy', function () {
		const otpStore = instance.create('otp', 'abcd');
		const sharedSecret = instance.share(otpStore);
		const currentToken = totp.generate(sharedSecret);
		expect(instance.validate(otpStore, currentToken)).to.be.ok;
	});

	it('MagicLink Strategy', async function () {
		const magicLinkStore = instance.create('magic-link', 'abcd');
		await instance.prepare(magicLinkStore);

		expect(sendEmail.calledOnce).to.be.true;
		expect(sendEmail.args[0][0]).to.equal('magic-link');
		expect(sendEmail.args[0][1]).to.have.property('token');

		expect(await instance.validate(magicLinkStore, sendEmail.args[0][1].token)).to.be.true;
	});
});
