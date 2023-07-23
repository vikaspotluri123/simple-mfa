import {Buffer} from 'node:buffer';
import {expect} from 'chai';
import {cleanProof} from '../../../dist/cjs/browser/index.js';

describe('Unit > Browser > Util', function () {
	it('Clean Proof', function () {
		const anObject = {};
		expect(cleanProof(123)).to.equal(123);
		expect(cleanProof(anObject)).to.equal(anObject);
		expect(cleanProof('123456')).to.equal('123456');
		expect(
			Buffer.from(
				cleanProof(Buffer.from('UPPER').toString('base64')),
				'base64',
			).toString('utf8'),
		).to.equal('UPPER');
	});
});
