import {describe, it, beforeEach} from 'node:test';
import {expect} from 'chai';
import {OtpStrategy} from '../../../dist/cjs/strategy/otp.js';
import {StrategyError} from '../../../dist/cjs/error.js';
import {createOtp} from '../../../dist/cjs/testing/index.js';
import {MockedCrypto} from '../../fixtures/crypto.js';

// eslint-disable-next-line camelcase
const user_id = 'user_id';

const generateId = () => 'rAnDOmId';

const crypto = new MockedCrypto();
const strategy = new OtpStrategy();

const config = {generateId, crypto};

describe('Unit > Strategy > OTP', function () {
	/** @type {Awaited<ReturnType<strategy['create']>>} */
	let store;

	async function realOtp() {
		return createOtp(await strategy.getSecret(store, config));
	}

	beforeEach(async function () {
		store = await strategy.create(user_id, OtpStrategy.type, config);
	});

	it('create', async function () {
		expect(store).to.deep.contain({
			id: generateId(),
			type: OtpStrategy.type,
			status: 'pending',
			user_id, // eslint-disable-line camelcase
		});

		expect(store.context).to.be.a('string').and.with.length.greaterThan(16);
		const decrypted = await crypto.decodeSecret(OtpStrategy.type, store.context);
		expect(decrypted).to.have.length(16);
	});

	it('prepare', async function () {
		expect(strategy.prepare(store, '', config)).to.equal(undefined);
	});

	describe('validate', function () {
		it('valid use case', async function () {
			// @TODO: update types to reject promises
			expect(strategy.validate(store, await realOtp(), config)).to.be.ok;
		});

		it('invalid OTP', async function () {
			expect(await strategy.validate(store, '000-000', config)).to.be.false;

			try {
				await strategy.validate(store, 15, config);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Invalid client payload');
			}
		});

		it('invalid secret (not likely)', async function () {
			const validOtp = await realOtp();
			store.context = store.context.slice(0, -5);
			expect(await strategy.validate({...store}, validOtp, config)).to.be.false;
		});
	});

	it('postvalidate', async function () {
		const store = await strategy.create(user_id, OtpStrategy.type, config);
		const token = createOtp(await strategy.getSecret(store, config));
		expect(strategy.postValidate(store, token, config)).to.not.be.ok;
	});

	it('getSecret', async function () {
		const store = await strategy.create(user_id, OtpStrategy.type, config);
		const secret = await strategy.getSecret(store, config);
		expect(secret).to.be.a('string').with.length(16);
		expect(await strategy.getSecret({...store}, config)).to.equal(secret);

		store.context = store.context.slice(0, -5);

		try {
			await strategy.getSecret({...store}, config);
			expect(false, 'should have thrown').to.be.true;
		} catch (error) {
			expect(error).to.be.an.instanceOf(StrategyError);
		}
	});
});
