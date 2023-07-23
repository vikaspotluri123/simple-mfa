// @ts-check
import process from 'node:process';
import {loadSecrets} from './0-instance.js';
import {loggerFor} from './99-utils.js';

/**
 * @param {import('@potluri/simple-mfa').SimpleMfaInstance} instance
 */
export function demoSecretsSync(instance) {
	const printEnd = loggerFor('SECRETS');
	console.log('SimpleMfa secrets - before syncing:', JSON.stringify(loadSecrets(), null, 2));

	const secrets = instance.syncSecrets();

	if (secrets) {
		console.log('Secrets changed! Time to update our stored secrets.');
		console.log(`SimpleMfa secrets - after syncing: ${JSON.stringify(secrets, null, 2)}`);
	}

	process.stdout.write('Let\'s sync again... ');

	if (instance.syncSecrets()) {
		console.log('the secrets changed again! That\'s unexpected...');
	} else {
		console.log('the secrets did not change; syncSecrets() should only be run one time!');
	}

	printEnd();
}
