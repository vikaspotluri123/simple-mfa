// @ts-check

import {expect} from 'chai';
import {totp} from 'otplib';
import {createSimpleMFA} from '../../dist/index.js';
import {DEFAULT_STRATEGIES} from '../../dist/default-strategies.js';

const instance = createSimpleMFA({strategies: DEFAULT_STRATEGIES});

describe('Integration > SimpleMFA', () => {
	it('OTP Strategy', () => {
		const otpStore = instance.create('otp', 'abcd');
		const sharedSecret = otpStore.context.split(':').pop();
		const currentToken = totp.generate(sharedSecret);
		expect(instance.validate(otpStore, currentToken)).to.be.ok;
	});
});
