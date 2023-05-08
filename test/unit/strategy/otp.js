// @ts-check

import {expect} from 'chai';
import {OtpStrategy} from '../../../dist/cjs/strategy/otp.js';
import {StrategyError} from '../../../dist/cjs/error.js';
import {createOtp} from '../../../dist/cjs/testing/index.js';
import {MockedStorageService} from '../../fixtures/storage.js';

// eslint-disable-next-line camelcase
const user_id = 'user_id';

const generateId = () => 'rAnDOmId';

const storageService = new MockedStorageService();
const strategy = new OtpStrategy(storageService);

const config = {generateId};

describe('Unit > Strategy > OTP', function () {
	/** @type {Awaited<ReturnType<strategy['create']>>} */
	let store;

	async function realOtp() {
		return createOtp(await strategy.share(store));
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
		const decrypted = await storageService.decodeSecret(OtpStrategy.type, store.context);
		expect(decrypted).to.have.length(16);
	});

	it('prepare', async function () {
		expect(strategy.prepare(store, config)).to.equal(undefined);
	});

	describe('validate', function () {
		it('valid use case', function () {
			expect(strategy.validate(store, realOtp(), config)).to.be.ok;
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
			expect(await strategy.validate(store, validOtp, config)).to.be.false;
		});
	});

	it('share', async function () {
		expect(
			await strategy.share(await strategy.create(user_id, OtpStrategy.type, config)),
		).to.be.a('string').with.length(16);

		store.context = store.context.slice(0, -5);

		try {
			await strategy.share(store);
			expect(false, 'should have thrown').to.be.true;
		} catch (error) {
			expect(error).to.be.an.instanceOf(StrategyError);
		}
	});
});
