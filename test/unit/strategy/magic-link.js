// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {MagicLinkStrategy} from '../../../dist/strategy/magic-link.js';
import {StrategyError} from '../../../dist/error.js';

// eslint-disable-next-line camelcase
const owner_id = 'owner_id';

const generateId = () => 'rAnDOmId';
const sendEmail = sinon.stub();

const config = {generateId, sendEmail};

describe('Unit > MagicLink', function () {
	it('create', function () {
		const store = MagicLinkStrategy.create(owner_id, config);
		expect(store).to.deep.contain({
			id: generateId(),
			type: 'magic-link',
			status: 'active',
			owner_id, // eslint-disable-line camelcase
		});

		expect(store.context).to.be.a('string').with.length(16);
	});

	it('prepare', async function () {
		const store = MagicLinkStrategy.create(owner_id, config);
		expect(await MagicLinkStrategy.prepare(store, config)).to.equal('email_sent');
		expect(sendEmail.calledOnce).to.be.true;
	});

	describe('validate', function () {
		/** @type {ReturnType<MagicLinkStrategy['create']>} */
		let store;
		/** @type {string} */
		let token;

		beforeEach(async function () {
			sendEmail.reset();
			store = MagicLinkStrategy.create(owner_id, config);
			await MagicLinkStrategy.prepare(store, config);
			token = sendEmail.args[0][1].token;
		});

		it('does not allow duplicate uses', async function () {
			expect(await MagicLinkStrategy.validate(store, token)).to.be.ok;
			try {
				await MagicLinkStrategy.validate(store, token);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error).to.contain({isUserFacing: true});
				expect(error.message).to.contain('already been used');
			}
		});

		it('invalid token', async function () {
			try {
				await MagicLinkStrategy.validate(store, 15);
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Unable to understand');
			}

			try {
				await MagicLinkStrategy.validate(store, token.slice(5));
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Unable to read token');
			}
		});

		it('broken strategy', async function () {
			// NOTE: this test case is **highly** unlikely
			store.id = generateId + 'x';
			expect(await MagicLinkStrategy.validate(store, token)).to.be.false;
		});
	});

	it('share', function () {
		expect(() => MagicLinkStrategy.share(MagicLinkStrategy.create(owner_id, config))).to.throw(StrategyError);
	});
});
