---
layout: default
title: Integrating
nav_order: 0
parent: Getting Started
---

# Integrating SimpleMfa

## Create a singleton

The first step to integrating SimpleMfa is creating a singleton instance. Here's an example using SimpleMfa's defaults:

{: .hint}
If you don't like code blocks, check out the [example application](https://github.com/vikaspotluri123/simple-mfa/tree/main/example/).

<!-- simple-mfa:lint -->
```javascript
// $lib/simple-mfa.js
import {getSecrets, updateSecrets} from 'your-app:secrets-api';
import {createSimpleMfa, SimpleMfaNodeCrypto} from '@potluri/simple-mfa';
import {defaultStrategies} from '@potluri/simple-mfa/default-strategies.js';

// Refer to the `Secrets Management` related link for more info.
const SECRETS_KEY = 'second_factors';
const secrets = await getSecrets(SECRETS_KEY);

export const simpleMfa = createSimpleMfa({
	// When possible, SimpleMfa defers to this cryptography instance for security-sensitive functions
	// (secrets generation, encrypting/decrypting secrets, etc)
	crypto: new SimpleMfaNodeCrypto(secrets),
	// Refer to the `Strategies` related link for a deeper look
	strategies: defaultStrategies(),
	// If you need to store additional data with the second factor, you can provide it here
	customStoredFields: {
		// You can define a getter to lazily provide the additional data
		get created_at() {
			return new Date().toISOString();
		},
		// You can directly provide default values
		deleted_at: null,
		// If the value is context-dependent (so you can't use a getter), you can use provide a
		// temporary default, and override it after creating a second factor.
		name: '',
	},
});

// Refer to the `Secrets Management` related link for more info.
const updatedSecrets = simpleMfa.syncSecrets();
if (updatedSecrets) {
	await updateSecrets(SECRETS_KEY, updatedSecrets);
}
```

**Related Links**:

 - [Secrets Management](../../concepts/secrets-management)
 - [Strategies](../../concepts/strategies)

## Second Factor Management

SimpleMfa can serve as a sidecar for user-side factor management:

 - Creating a second factor
 - Activating a second factor to make sure the user has set it up correctly
 - Confirming a status change is valid

For each of these actions, there's an associated method, and each of these methods is type-safe:

<!-- simple-mfa:lint -->
```javascript
import {simpleMfa} from '$lib/simple-mfa.js';

// Create a second factor - fully type safe based on the strategies provided to the singleton
const secondFactor = await simpleMfa.create('otp', 'user_id');
secondFactor.name = 'My first factor!';

// Activate a second factor
const proof = await getProofFromUser();
if (await simpleMfa.activate(secondFactor, proof)) {
	// Activation successful!
	return {success: true};
} else {
	// Activation failed :/
	return {error: 'Invalid proof'};
}

// Confirm a status change - in this case, an error will be thrown
// because you can't go from `pending` to `disabled`
simpleMfa.assertStatusTransition(secondFactor, 'disabled');
```

## MFA Validation

SimpleMfa also serves as the middleman for second factor validation:

 - Context-aware factor serialization
 - Factor Validation

<!-- simple-mfa:lint -->
```javascript
import {simpleMfa} from '$lib/simple-mfa.js';

const unsafeFactors = await lookupSecondFactors('user_id');

// Context-aware factor serialization
// Convert an array of database factors to one that is public facing.
// The second parameter determines the trust level:
//  - In trusted contexts (e.g. for factor management), some secrets will be decoded and listed
//  - In untrusted contexts (e.g. for factor validation), all sensitive data will be completely stripped.
// SimpleMfa#serializeAll is a convenience wrapper for SimpleMfa#serialize on arrays
const factors = await simpleMfa.serializeAll(unsafeFactors, false);
const {proof, factorId} = await getSecondFactorProof(factors);

// Factor Validation
const factor = await fetchFactorFromStorage(factorId);
const validationResult = await simpleMfa.validate(factor, proof);

switch (validationResult.type) {
	// User has proved who they are
	case 'validationSucceeded': {
		return {success: true, complete: true};
	}

	// User has failed to prove who they are
	case 'validationFailed': {
		return {success: false, complete: false, message: 'Invalid proof'};
	}

	// We have to do something for the user to prove who they are
	// (e.g. send an email)
	case 'serverActionRequired': {
		switch (validationResult.response.action) {
			// Action is a string* describing the action to be taken - you need to respond accordingly.
			// *fully type safe - typescript will infer the available cases for you 🎉

			// Note: SimpleMfa doesn't provide any kind of rate limiting -
			// make sure these actions are guarded from misuse.

			// possible cases intentionally omitted in this section
			default: {
				logger.error({message: `Unknown SimpleMfa server action: ${validationResult.response.action}`});
				return {success: false, complete: false, message: 'Something went wrong'};
			}
		}
	}

	default: {
		logger.error({message: `Unknown SimpleMfa validation result: ${validationResult.type}`});
		return {success: false, complete: false, message: 'Something went wrong'};
	}
}
```

## Magic Strings

In the default strategies, SimpleMfa makes use of "magic strings" (exported as constants) for certain actions:

 - `MAGIC_LINK_REQUESTING_EMAIL` - A constant used to tell the magic link strategy that an email needs to be sent.
 - `BACKUP_CODE_PENDING_TO_ACTIVE_PROOF` - A constant used to tell the backup code strategy that the codes have been reviewed so the factor can be activated.
