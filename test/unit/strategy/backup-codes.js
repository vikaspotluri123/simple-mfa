// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {BackupCodeStrategy} from '../../../dist/strategy/backup-code.js';
import {MockedStorageService} from '../../fixtures/storage.js';
import {StrategyError} from '../../../dist/error.js';

// eslint-disable-next-line camelcase
const owner_id = 'owner_id';

const generateId = () => 'rAnDOmId';
const sendEmail = sinon.stub();

const strategy = new BackupCodeStrategy(new MockedStorageService());

const config = {generateId, sendEmail};

describe('Unit > Strategy > MagicLink', function () {
	it('create', async function () {
		const rows = await strategy.create(owner_id, config);
		expect(rows).to.be.an('array').with.length(10);

		for (const store of rows) {
			console.log({store});
			expect(store).to.deep.contain({
				id: generateId(),
				type: 'backup-code',
				status: 'active',
				owner_id, // eslint-disable-line camelcase
			});
			expect(store.context).to.be.a('string').with.length(72);
			// eslint-disable-next-line no-await-in-loop
			expect(await strategy.share(store)).to.have.length(14);
		}
	});

	it('prepare', async function () {
		const store = strategy.create(owner_id, config);
		expect(strategy.prepare(store[0], config)).to.be.undefined;
	});

	describe('validate', function () {
		/** @type {Awaited<ReturnType<strategy['create']>>} */
		let store;
		/** @type {string} */
		let token;

		beforeEach(async function () {
			store = await strategy.create(owner_id, config);
			// eslint-disable-next-line unicorn/no-await-expression-member
			token = (await strategy.share(store[0])).replace(/-/g, '');
		});

		it('invalid token', async function () {
			expect(await strategy.validate(store[0], 15, config)).to.be.false;
			expect(await strategy.validate(store[0], token.slice(5), config)).to.be.false;
		});
	});

	it('share', async function () {
		const store = await strategy.create(owner_id, config);
		expect(await strategy.share(store[0])).to.match(/^(?:\d{4}-){2}\d{4}$/);

		// NOTE: this is highly unlikely
		store[0].context = '';
		try {
			await strategy.share(store[0]);
		} catch (error) {
			expect(error).to.be.instanceOf(StrategyError);
		}
	});
});
