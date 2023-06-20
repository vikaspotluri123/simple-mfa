// @ts-check
import sinon from 'sinon';
import {expect} from 'chai';
import {DefaultTokenStore} from '../../../../dist/cjs/strategy/_magic-link/token-store.js';
import {MagicLinkStrategy} from '../../../../dist/cjs/strategy/magic-link.js';
import {MockedCrypto} from '../../../fixtures/crypto.js';
import {StrategyError} from '../../../../dist/cjs/error.js';

const crypto = new MockedCrypto();
const store = new DefaultTokenStore();
const strategy = new MagicLinkStrategy().create(
	'user', MagicLinkStrategy.type, {generateId: () => 'user', crypto},
);

describe('Unit > Strategy > MagicLink > TokenStore', function () {
	it('validate', async function () {
		let validToken = await store.create(strategy, crypto);
		const assertValid = async (token, validity, message) => store.validate(strategy, crypto, token)
			.catch(error => {
				if (error instanceof StrategyError) {
					return false;
				}

				throw error;
			})
			.then(valid => {
				expect(valid, message).to.equal(validity);
			});

		await assertValid(validToken, true, 'First use works');
		await assertValid(validToken, false, 'Second use fails');
		await assertValid(validToken.slice(0, -1), false, 'Malformed token fails');

		const strategyId = strategy.id;
		try {
			validToken = await store.create(strategy, crypto);
			strategy.id += 'f';
			await assertValid(validToken, false, 'Strategy mismatch fails');
		} finally {
			strategy.id = strategyId;
		}

		const dateStub = sinon.stub(Date, 'now').returns(0);
		validToken = await store.create(strategy, crypto);
		dateStub.restore();
		expect(await assertValid(validToken, false, 'Expired token fails'));
	});
});
