// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {MagicLinkStrategy} from '../../../dist/strategy/magic-link.js';
import {StrategyError} from '../../../dist/error.js';

// eslint-disable-next-line camelcase
const owner_id = 'owner_id';

const generateId = () => 'rAnDOmId';
const sendEmail = sinon.stub();

const strategy = new MagicLinkStrategy();

const config = {generateId, sendEmail};

describe('Unit > Strategy > MagicLink', function () {
	it('create', function () {
		const store = strategy.create(owner_id, config);
		expect(store).to.deep.contain({
			id: generateId(),
			type: 'magic-link',
			status: 'active',
			owner_id, // eslint-disable-line camelcase
		});

		expect(store.context).to.be.a('string').with.length(16);
	});

	it('prepare', async function () {
		const store = strategy.create(owner_id, config);
		// Explicitly type the response to make sure it aligns
		/** @type {'email_sent'} */
		const prepareResponse = await strategy.prepare(store, config);
		expect(prepareResponse).to.equal('email_sent');
		expect(sendEmail.calledOnce).to.be.true;
	});

	describe('validate', function () {
		/** @type {ReturnType<strategy['create']>} */
		let store;
		/** @type {string} */
		let token;

		beforeEach(async function () {
			sendEmail.reset();
			store = strategy.create(owner_id, config);
			await strategy.prepare(store, config);
			token = sendEmail.args[0][1].token;
		});

		it('does not allow duplicate uses', async function () {
			expect(await strategy.validate(store, token, config)).to.be.ok;
			try {
				await strategy.validate(store, token, config);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error).to.contain({isUserFacing: true});
				expect(error.message).to.contain('already been used');
			}
		});

		it('invalid token', async function () {
			try {
				await strategy.validate(store, 15, config);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Unable to understand');
			}

			try {
				await strategy.validate(store, token.slice(5), config);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Unable to read token');
			}
		});

		it('broken strategy', async function () {
			// NOTE: this test case is **highly** unlikely
			store.id = generateId + 'x';
			expect(await strategy.validate(store, token, config)).to.be.false;
		});
	});

	it('share', function () {
		expect(() => strategy.share(strategy.create(owner_id, config))).to.throw(StrategyError);
	});
});
