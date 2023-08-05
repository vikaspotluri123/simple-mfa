// @ts-check
import {OTHER_USER, PASSWORD, USERNAME} from './00-constants.js';
import {simpleMfa} from './0-instance.js';
import {loggerFor} from './99-utils.js';

/**
 * @param {ReturnType<import('@potluri/simple-mfa/default-strategies').defaultStrategies>} strategies
 */
export async function createDemoStrategies(strategies) {
	/** @type {Array<keyof typeof strategies>} */
	// @ts-expect-error
	const strategyNames = Object.keys(strategies);

	const secrets = await Promise.all(strategyNames.flatMap(strategy => [
		simpleMfa.create(strategy, USERNAME), simpleMfa.create(strategy, OTHER_USER),
	]));

	const printEnd = loggerFor('USER DATA');

	console.log(`  Username: ${USERNAME}`);
	console.log(`  Password: ${PASSWORD}`);

	console.log('');
	console.log('Second Factors:\n');

	for (const factor of secrets) {
		if (factor.user_id === USERNAME) {
			const {status, type, context = ''} = factor;
			/** @type {any} */
			const forPrint = {status, type, context};
			/** @type {Record<string, any>} */
			// eslint-disable-next-line no-await-in-loop
			const serialized = await simpleMfa.serialize(forPrint, true);
			serialized.secret = serialized.context ?? '(none)';
			delete serialized.context;
			console.log(' ', JSON.stringify(serialized, null, 2).replaceAll('\n', '\n  '));
		}
	}

	printEnd();
	return secrets;
}
