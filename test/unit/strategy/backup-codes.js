// @ts-check

import sinon from 'sinon';
import {expect} from 'chai';
import {BackupCodeStrategy} from '../../../dist/esm/strategy/backup-code.js';
import {MockedStorageService} from '../../fixtures/storage.js';
import {StrategyError} from '../../../dist/esm/error.js';

// eslint-disable-next-line camelcase
const owner_id = 'owner_id';

const generateId = () => 'rAnDOmId';
const sendEmail = sinon.stub();

const strategy = new BackupCodeStrategy(new MockedStorageService());

const config = {generateId, sendEmail};

describe('Unit > Strategy > Backup Codes', function () {
	it('create', async function () {
		const store = await strategy.create(owner_id, BackupCodeStrategy.type, config);
		expect(store).to.deep.contain({
			id: generateId(),
			type: BackupCodeStrategy.type,
			status: 'active',
			owner_id, // eslint-disable-line camelcase
		});
	});

	it('prepare', async function () {
		const store = strategy.create(owner_id, BackupCodeStrategy.type, config);
		expect(strategy.prepare(store[0], config)).to.be.undefined;
	});

	it('validate', async function () {
		const store = await strategy.create(owner_id, BackupCodeStrategy.type, config);
		// eslint-disable-next-line unicorn/no-await-expression-member
		const token = (await strategy.share(store))[0].replace(/-/g, '');

		// Trigger cache miss for coverage
		expect(await strategy.validate({...store}, 15, config)).to.be.false;
		expect(await strategy.validate(store, token.slice(5), config)).to.be.false;
		expect(await strategy.validate(store, token.replace(/-/g, ''), config)).to.be.true;
	});

	it('postValidate', async function () {
		let store = await strategy.create(owner_id, BackupCodeStrategy.type, config);
		const codes = await strategy.share(store);

		let codesCount = codes.length;

		/* eslint-disable no-await-in-loop */
		for (const hyphenateCode of codes) {
			const code = hyphenateCode.replace(/-/g, '');
			expect(await strategy.validate(store, code, config), 'first use should pass').to.be.true;
			store = await strategy.postValidate(store, code, config);
			expect(await strategy.validate(store, code, config), 'second use should fail').to.be.false;
			expect(await strategy.share(store), 'shared codes should not include expired codes')
				.to.have.length(--codesCount);
		}
		/* eslint-enable no-await-in-loop */
	});

	it('share', async function () {
		const store = await strategy.create(owner_id, BackupCodeStrategy.type, config);
		const codes = await strategy.share(store);
		expect(codes).to.be.an('array').with.length(10);
		for (const code of codes) {
			expect(code).to.match(/^(?:\d{4}-){2}\d{4}$/);
		}

		try {
			// Create a new object to prevent using cached data
			await strategy.share({...store, context: ''});
			expect(false, 'should have failed').to.be.true;
		} catch (error) {
			expect(error).to.be.instanceOf(StrategyError);
		}
	});
});
