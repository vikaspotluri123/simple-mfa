import {describe, it} from 'node:test';
import {expect} from 'chai';
import {getOtpUri} from '../../../dist/cjs/browser/index.js';

describe('Unit > Browser > OTP', function () {
	it('getOtpUri', function () {
		expect(getOtpUri(
			'Letters & Son\'s: Characters',
			'hello@example.com',
			'JBSWY3DPEHPK3PXP',
		)).to.equal('otpauth://totp/Letters%20&%20Son\'s-%20Characters:hello@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Letters+%26+Son%27s%3A+Characters');

		expect(getOtpUri(
			'Letters & Son\'s: Characters',
			'hello@example.com',
			'JBSWY3DPEHPK3PXP',
			'Son\'s: Letters',
		)).to.equal('otpauth://totp/Son\'s-%20Letters:hello@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Letters+%26+Son%27s%3A+Characters');
	});
});
