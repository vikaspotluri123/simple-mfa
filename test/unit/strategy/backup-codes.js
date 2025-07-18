import {describe, it} from 'node:test';
import {expect} from 'chai';
import {BackupCodeStrategy} from '../../../dist/cjs/strategy/backup-code.js';
import {StrategyError} from '../../../dist/cjs/error.js';
import {MockedCrypto} from '../../fixtures/crypto.js';

// eslint-disable-next-line camelcase
const user_id = 'user_id';

const generateId = () => 'rAnDOmId';

const strategy = new BackupCodeStrategy();
const config = {generateId, crypto: new MockedCrypto()};

describe('Unit > Strategy > Backup Codes', function () {
	it('create', async function () {
		const store = await strategy.create(user_id, BackupCodeStrategy.type, config);
		expect(store).to.deep.contain({
			id: generateId(),
			type: BackupCodeStrategy.type,
			status: 'pending',
			user_id, // eslint-disable-line camelcase
		});
	});

	it('prepare', async function () {
		const store = await strategy.create(user_id, BackupCodeStrategy.type, config);
		expect(strategy.prepare(store, '', config)).to.be.undefined;
	});

	it('validate', async function () {
		const store = await strategy.create(user_id, BackupCodeStrategy.type, config);
		const codes = await strategy.getSecret(store, config);
		const validCode = codes[0].replaceAll('-', '');

		expect(await strategy.validate(store, 'acknowledged', config)).to.be.true;
		expect(await strategy.validate(store, validCode, config)).to.be.false;

		store.status = 'active';

		// Trigger cache miss for coverage
		expect(await strategy.validate({...store}, 15, config)).to.be.false;
		expect(await strategy.validate(store, validCode.slice(5), config)).to.be.false;
		expect(await strategy.validate(store, validCode.replaceAll('-', ''), config)).to.be.true;
	});

	it('postValidate', async function () {
		const store = await strategy.create(user_id, BackupCodeStrategy.type, config);
		store.status = 'active';
		const codes = await strategy.getSecret(store, config);

		let codesCount = codes.length;

		expect(await strategy.postValidate(store, 'does-not-exist', config)).to.not.be.ok;

		/* eslint-disable no-await-in-loop */
		for (const hyphenateCode of codes) {
			const code = hyphenateCode.replaceAll('-', '');
			expect(await strategy.validate(store, code, config), 'first use should pass').to.be.true;
			await strategy.postValidate(store, code, config);
			expect(await strategy.validate(store, code, config), 'second use should fail').to.be.false;
			expect(await strategy.getSecret(store, config), 'codes should not include expired codes')
				.to.have.length(--codesCount);
		}
		/* eslint-enable no-await-in-loop */
	});

	it('getSecret', async function () {
		const store = await strategy.create(user_id, BackupCodeStrategy.type, config);
		const codes = await strategy.getSecret(store, config);
		expect(codes).to.be.an('array').with.length(10);
		for (const code of codes) {
			expect(code).to.match(/^(?:\d{4}-){2}\d{4}$/);
		}

		try {
			// Create a new object to prevent using cached data
			await strategy.getSecret({...store, context: ''}, config);
			expect(false, 'should have failed').to.be.true;
		} catch (error) {
			expect(error).to.be.instanceOf(StrategyError);
		}
	});
});
