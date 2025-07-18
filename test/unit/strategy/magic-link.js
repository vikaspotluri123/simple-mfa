import {describe, it} from 'node:test';
import {expect} from 'chai';
import {MAGIC_LINK_REQUESTING_EMAIL, MAGIC_LINK_SERVER_TO_SEND_EMAIL} from '../../../dist/cjs/constants.js';
import {MagicLinkStrategy} from '../../../dist/cjs/strategy/magic-link.js';
import {MockedCrypto} from '../../fixtures/crypto.js';
import {StrategyError} from '../../../dist/cjs/error.js';

// eslint-disable-next-line camelcase
const user_id = 'user_id';

const generateId = () => 'rAnDOmId';
const strategy = new MagicLinkStrategy();
const config = {generateId, crypto: new MockedCrypto()};

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
		/** @type {{action: typeof MAGIC_LINK_SERVER_TO_SEND_EMAIL, data: {token: string}} | undefined} */
		const prepareResponse = await strategy.prepare(store, MAGIC_LINK_REQUESTING_EMAIL, config);

		// Wrapped like this for type safety
		if (!prepareResponse) {
			expect(prepareResponse).to.be.ok;
			return;
		}

		expect(prepareResponse.action).to.equal(MAGIC_LINK_SERVER_TO_SEND_EMAIL);
		expect(prepareResponse.data).to.be.an('object').with.keys(['token']);
		expect(Object.keys(prepareResponse)).to.have.length(2);
	});

	it('validate', async function () {
		const store = strategy.create(user_id, MagicLinkStrategy.type, config);
		// @ts-expect-error we can't do non-null assertions in js
		const {data: {token}} = await strategy.prepare(store, MAGIC_LINK_REQUESTING_EMAIL, config);
		expect(await strategy.validate(store, token, config)).to.be.ok;
		try {
			await strategy.validate(store, 16, config);
		} catch (error) {
			expect(error).to.be.instanceof(StrategyError);
			expect(error.isUserFacing).to.be.true;
			expect(error.message).to.contain('understand');
		}
	});

	it('postvalidate', async function () {
		const store = strategy.create(user_id, MagicLinkStrategy.type, config);
		// @ts-expect-error we can't do non-null assertions in js
		const {data: {token}} = await strategy.prepare(store, MAGIC_LINK_REQUESTING_EMAIL, config);
		expect(strategy.postValidate(store, token, config)).to.not.be.ok;
	});

	it('getSecret', function () {
		expect(strategy.getSecret(strategy.create(user_id, MagicLinkStrategy.type, config))).to.equal(null);
	});
});
