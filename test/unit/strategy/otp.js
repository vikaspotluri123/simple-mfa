// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {totp} from 'otplib';
import {OtpStrategy} from '../../../dist/strategy/otp.js';
import {StrategyError} from '../../../dist/error.js';

// eslint-disable-next-line camelcase
const owner_id = 'owner_id';

const generateId = () => 'rAnDOmId';
const sendEmail = sinon.stub();

const strategy = new OtpStrategy();

const config = {generateId, sendEmail};

describe('Unit > Strategy > OTP', function () {
	/** @type {ReturnType<strategy['create']>} */
	let store;

	function realOtp() {
		return totp.generate(strategy.share(store));
	}

	beforeEach(function () {
		store = strategy.create(owner_id, config);
	});

	it('create', function () {
		expect(store).to.deep.contain({
			id: generateId(),
			type: 'otp',
			status: 'pending',
			owner_id, // eslint-disable-line camelcase
		});

		expect(store.context).to.be.a('string').with.length(18);
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

		it('broken strategy', async function () {
			// NOTE: this test case is **highly** unlikely
			store.context = store.context.replace('0:', '-1:');

			try {
				await strategy.validate(store, realOtp(), config);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error).to.be.an.instanceof(StrategyError);
				expect(error.message).to.contain('unknown version');
			}
		});
	});

	it('share', function () {
		expect(strategy.share(strategy.create(owner_id, config))).to.be.a('string').with.length(16);
	});
});
