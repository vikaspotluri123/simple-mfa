// @ts-check

import {expect} from 'chai';
import {MAGIC_LINK_REQUESTING_EMAIL, MAGIC_LINK_SERVER_TO_SEND_EMAIL} from '../../../dist/cjs/constants.js';
import {MagicLinkStrategy} from '../../../dist/cjs/strategy/magic-link.js';
import {MockedStorageService} from '../../fixtures/storage.js';

// eslint-disable-next-line camelcase
const user_id = 'user_id';

const generateId = () => 'rAnDOmId';
const strategy = new MagicLinkStrategy(new MockedStorageService());
const config = {generateId};

describe('Unit > Strategy > MagicLink', function () {
	it('create', function () {
		const store = strategy.create(user_id, MagicLinkStrategy.type, config);
		expect(store).to.deep.contain({
			id: generateId(),
			type: MagicLinkStrategy.type,
			status: 'active',
			user_id, // eslint-disable-line camelcase
		});

		expect(store.context).to.be.undefined;
	});

	it('prepare', async function () {
		const store = strategy.create(user_id, MagicLinkStrategy.type, config);
		expect(await strategy.prepare(store, '', config)).to.not.be.ok;

		// Explicitly type the response to make sure it aligns
		/** @type {{type: typeof MAGIC_LINK_SERVER_TO_SEND_EMAIL, data: {token: string}} | undefined} */
		const prepareResponse = await strategy.prepare(store, MAGIC_LINK_REQUESTING_EMAIL, config);

		// Wrapped like this for type safety
		if (!prepareResponse) {
			expect(prepareResponse).to.be.ok;
			return;
		}

		expect(prepareResponse.type).to.equal(MAGIC_LINK_SERVER_TO_SEND_EMAIL);
		expect(prepareResponse.data).to.be.an('object').with.keys(['token']);
		expect(Object.keys(prepareResponse)).to.have.length(2);
	});

	describe('validate', function () {
		/** @type {ReturnType<strategy['create']>} */
		let store;
		/** @type {string} */
		let token;

		beforeEach(async function () {
			store = strategy.create(user_id, MagicLinkStrategy.type, config);
			// @ts-expect-error we can't do non-null assertions in js
			({data: {token}} = await strategy.prepare(store, MAGIC_LINK_REQUESTING_EMAIL, config));
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
				expect(await strategy.validate(store, 15, config)).to.be.false;
				expect(false, 'should have thrown').to.be.true;
			} catch (error) {
				expect(error.message).to.contain('Unable to understand this MagicLink');
			}

			expect(await strategy.validate(store, token.slice(5), config)).to.be.false;
		});

		it('broken strategy', async function () {
			// NOTE: this test case is **highly** unlikely
			store.id = generateId + 'x';
			expect(await strategy.validate(store, token, config)).to.be.false;
		});
	});

	it('share', function () {
		expect(strategy.share(strategy.create(user_id, MagicLinkStrategy.type, config))).to.equal(null);
	});
});
