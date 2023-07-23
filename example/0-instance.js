// @ts-check

import {createSimpleMfa, SimpleMfaNodeCrypto} from '@potluri/simple-mfa';
import {defaultStrategies} from '@potluri/simple-mfa/default-strategies.js';

export const loadSecrets = () => ({});

export const strategies = defaultStrategies();
/**
 * @type {import('@potluri/simple-mfa').SimpleMfaInstance<typeof strategies>}
 */
export const simpleMfa = createSimpleMfa({
	strategies,
	crypto: new SimpleMfaNodeCrypto(loadSecrets()),
});
