// @ts-check
import {StrategyError} from '@potluri/simple-mfa';
import {cleanProof} from '@potluri/simple-mfa/browser.js';
import {simpleMfa} from './0-instance.js';

/**
 * @typedef {keyof typeof import('./0-instance.js').strategies} StrategyType
 * @typedef {import('@potluri/simple-mfa').BasicAuthStrategy<StrategyType>[]} DemoStrategies
 */

/**
 * @param {DemoStrategies} userStrategies
 */
export function createBrowseController(userStrategies) {
	/**
	 * @param {import('@potluri/simple-mfa').BasicAuthStrategy['status'] | null} status
	 */
	return (user, status, isTrusted = true) => simpleMfa.serializeAll(
		userStrategies.filter(
			strategy => strategy.user_id === user && (status ? strategy.status === status : true),
		),
		isTrusted,
	).catch(error => {
		console.log(error);
		return {error: 'Failed serializing! Check your console'};
	});
}

/**
 * @param {DemoStrategies} userStrategies
 */
export function createReadController(userStrategies) {
	return (user, id) => simpleMfa.serializeAll(
		userStrategies.filter(
			strategy => strategy.user_id === user && strategy.id === id,
		),
		true,
	).catch(error => {
		console.log(error);
		return {error: 'Failed serializing! Check your console'};
	});
}

/** @param {unknown} error */
function _handlePossibleStrategyError(error) {
	if (error instanceof StrategyError && error.isUserFacing) {
		return {error: error.message};
	}

	console.error('Unknown error:');
	console.error(error);
	return {error: 'Check your console'};
}

/**
 * @param {DemoStrategies} userStrategies
 */
export function createActivateController(userStrategies) {
	/**
	 * @param {string} user
	 * @param {string} id
	 * @param {unknown} proof
	 */
	return async (user, id, proof) => {
		const strategy = userStrategies.find(maybeStrategy => maybeStrategy.user_id === user && maybeStrategy.id === id);
		if (!strategy) {
			return {error: 'Strategy not found'};
		}

		try {
			const activated = await simpleMfa.activate(strategy, cleanProof(proof));

			if (activated) {
				simpleMfa.assertStatusTransition(strategy, 'active');
				strategy.status = 'active';
				return {success: true};
			}

			return {error: 'Invalid proof'};
		} catch (error) {
			return _handlePossibleStrategyError(error);
		}
	};
}

/**
 * @param {DemoStrategies} userStrategies
 */
export function createValidateController(userStrategies) {
	/**
	 * @param {string} user
	 * @param {string} id
	 * @param {unknown} proof
	 * @param {string} origin
	 */
	return async (user, id, proof, origin) => {
		const strategy = userStrategies.find(maybeStrategy => maybeStrategy.user_id === user && maybeStrategy.id === id);

		if (!strategy) {
			return {error: 'Strategy not found'};
		}

		try {
			const result = await simpleMfa.validate(strategy, cleanProof(proof));

			switch (result.type) {
				case 'serverActionRequired': {
					switch (result.response.action) {
						case 'magic_link_send_email': {
							console.log('Visit %s/second-factor/magic-link/%s:%s', origin, id, result.response.data.token);
							return {message: 'Check the console'};
						}

						default: {
							throw new Error('Unknown server action from SimpleMfa');
						}
					}
				}

				case 'validationFailed': {
					return {error: 'Invalid proof'};
				}

				case 'validationSucceeded': {
					if (result.response) {
						Object.assign(strategy, result.response);
					}

					return {success: true};
				}

				default: {
					throw new Error('Unknown response from SimpleMfa');
				}
			}
		} catch (error) {
			return _handlePossibleStrategyError(error);
		}
	};
}
