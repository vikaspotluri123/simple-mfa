// @ts-check
import {Buffer} from 'node:buffer';
import {webcrypto} from 'node:crypto';
import sinon from 'sinon';
import {expect} from 'chai';
import {SimpleMfaNodeCrypto} from '../../dist/cjs/crypto.js';

const KEY = 'action';
const NEW_KEY = 'late_action';
const crypto = {
	randomUUID: () => webcrypto.randomUUID(),
	CryptoKey: webcrypto.CryptoKey,
	subtle: webcrypto.subtle,
	/** @type {typeof webcrypto['getRandomValues']} */
	getRandomValues: store => webcrypto.getRandomValues(store),
};

/** @type {SimpleMfaNodeCrypto<typeof KEY | typeof NEW_KEY>} */
// @ts-expect-error
const demo = new SimpleMfaNodeCrypto({[KEY]: Buffer.from('ThisIsASecretKey').toString('hex')}, crypto);

const cypherWithStubbedIv = '42424242424242424242424242424242Zfgmc/nfd6kxCGeJJI9jpJmKuYYHjCMXxGiYR9t7gojQXKe4Y4wNQIXbmLGBVyJNRpSn1LAB2GQI';
const plainText = 'This is extremely secret! Don\'t touch it!';

/** @param {Uint8Array} vector */
const stubIv = vector => vector.fill(0x42);

describe('Unit > SimpleMfaNodeCrypto', function () {
	beforeEach(function () {
		sinon.restore();
	});

	it('can safely encrypt data', async function () {
		const randomIvCypher = await demo.encodeSecret(KEY, plainText);
		expect(randomIvCypher).to.have.length(cypherWithStubbedIv.length);
		expect(randomIvCypher).to.not.equal(cypherWithStubbedIv);

		crypto.getRandomValues = sinon.stub().callsFake(stubIv);

		expect(await demo.encodeSecret(KEY, plainText)).to.equal(cypherWithStubbedIv);
	});

	it('can safely decrypt data', async function () {
		expect(await demo.decodeSecret(KEY, cypherWithStubbedIv)).to.equal(plainText);
	});

	it('update allows immediate usage of a new key', async function () {
		const whenKeyIsLoaded = demo.update(NEW_KEY, Buffer.from('ThisIsASecretKey').toString('hex'));
		expect(await demo.encodeSecret(NEW_KEY, plainText)).to.equal(cypherWithStubbedIv);
		await whenKeyIsLoaded;
		expect(await demo.encodeSecret(NEW_KEY, plainText)).to.equal(cypherWithStubbedIv);
	});
});
