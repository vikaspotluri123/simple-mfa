// @ts-check
import {MAGIC_LINK_REQUESTING_EMAIL, BACKUP_CODE_PENDING_TO_ACTIVE_PROOF} from '@potluri/simple-mfa';
import {urlencoded} from 'express';
import {USERNAME, PASSWORD} from './00-constants.js';

/**
 * @typedef {ReturnType<import('./4-simple-mfa-controllers.js')['createBrowseController']>} BrowseController
 * @typedef {ReturnType<import('./4-simple-mfa-controllers.js')['createReadController']>} ReadController
 * @typedef {ReturnType<import('./4-simple-mfa-controllers.js')['createValidateController']>} ValidateController
 * @typedef {ReturnType<import('./4-simple-mfa-controllers.js')['createActivateController']>} ActivateController
 */

/**
 * @param {Awaited<ReturnType<import('@potluri/simple-mfa').SimpleMfaInstance['serialize']>>} strategy
 * @param {boolean} forVerification
 */
function renderStrategy(strategy, forVerification) {
	switch (strategy.type) {
		case 'backup-code': {
			if (forVerification) {
				return {html: '<label for="proof">Backup Code:</label><input type="text" name="proof" />'};
			}

			const input = `<input type="hidden" name="proof" value=${BACKUP_CODE_PENDING_TO_ACTIVE_PROOF} />`;
			return {html: `${input} The backup codes were printed to your console at the start.`, buttonText: 'Activate'};
		}

		case 'magic-link': {
			return {
				html: `<input type="hidden" name="proof" value=${MAGIC_LINK_REQUESTING_EMAIL}>`,
				buttonText: 'Send Magic Link',
			};
		}

		case 'otp': {
			const message = forVerification ? '' : 'The OTP secret as printed to your console at the start.<br />';
			return {html: `${message}<label for="proof">One Time Password:</label><input type="text" name="proof" />`};
		}

		default: {
			return {html: 'Error: unknown strategy', buttonText: ''};
		}
	}
}

function rootController(request, response) {
	if (request.session?.waitingForMfa) {
		response.status(401);
		response.setHeader('content-type', 'text/html');
		response.end('Waiting for MFA. <a href="/second-factor">Second Factor</a>');
	} else if (request.session?.user) {
		response.status(401);
		response.setHeader('content-type', 'text/html');
		response.end(`Logged in as ${request.session.user}. <a href="/second-factor">Activate strategies</a> &bull; <a href="/strategies">All Strategies</a> &bull; <a href="/logout">Log out</a>`);
	} else if (request.session) {
		response.status(200);
		response.setHeader('content-type', 'text/html');
		response.end('Not logged in. <a href="/login">Login</a>');
	} else {
		response.status(200).end('Unknown state');
	}
}

/** @param {BrowseController} browseController */
function strategiesController(browseController) {
	return async (request, response) => {
		if (!request.session.user) {
			response.redirect('/');
			return;
		}

		const myStrategies = await browseController(request.session.user, null);

		response.status(200);
		response.setHeader('content-type', 'application/json');
		response.write(JSON.stringify(myStrategies, null, 2));
	};
}

function loginPageController(request, response) {
	const data = `
<form method="post">
	<label for="username">Username</label>
	<input type="text" id="username" name="username" value="${USERNAME}" /><br/>

	<label for="password">Password</label>
	<input type="text" id="password" name="password" value="${PASSWORD}" /><br/>

	<button autofocus type="submit">Login</button>
</form>
`;

	response.send(data);
}

function loginPostController(request, response) {
	if (request.body.username === USERNAME && request.body.password === PASSWORD) {
		request.session.user = request.body.username;
		request.session.waitingForMfa = true;
		request.session.completedStrategies = [];
		response.redirect('/');
		return;
	}

	response.status(401).send(`Invalid username or password. Try "${USERNAME}"/"${PASSWORD}"`);
}

/** @param {BrowseController} browseController */
function secondFactorSelectController(browseController) {
	return async (request, response) => {
		if (!request.session.user) {
			return response.redirect('/');
		}

		const status = request.session.waitingForMfa ? 'active' : 'pending';

		response.status(200);
		response.setHeader('content-type', 'text/html');
		const strategies = await browseController(request.session.user, status);
		let body = '<h1>Select a factor to use</h1><ul>';

		if ('error' in strategies) {
			response.status(500);
			response.send(strategies.error);
			return;
		}

		for (const strategy of strategies) {
			body += `<li><a href="/second-factor/${strategy.id}">${strategy.type}</a></li>\n`;
		}

		body += '</ul>';

		if (!request.session.waitingForMfa) {
			body += '<a href="/">Back</a>';
		}

		response.status(200);
		response.send(body);
	};
}

/**
 * @param {ReadController} read
 */
function secondFactorProofController(read) {
	/**
	 * @param {string | undefined | null} message
	 */
	return async (request, response, message = null) => {
		const id = request.params.id;

		if (!request.session.user) {
			return response.redirect('/');
		}

		const readResponse = await read(request.session.user, id);

		if ('error' in readResponse || readResponse.length !== 1) {
			response.status(500);
			response.send(('error' in readResponse && readResponse.error) || 'strategy count mismatch');
			return;
		}

		const [strategy] = readResponse;

		response.status(200);
		response.setHeader('content-type', 'text/html');
		const {html, buttonText = 'Verify'} = renderStrategy(strategy, Boolean(request.session.waitingForMfa));
		response.send(`
			<h1>Verify ${strategy.type} factor</h1>
			${typeof message === 'string' ? `<p>${message}</p>` : ''}
			<form method="post">
				${html}
				<button>${buttonText}</button>
				<a href="/second-factor">Back</a>
			</form>
		`);
	};
}

/**
 * @param {ActivateController} activate
 * @param {ValidateController} validate
 * @param {ReturnType<typeof secondFactorProofController>} secondFactorProof
 */
function secondFactorProofPostController(activate, validate, secondFactorProof) {
	return async (request, response) => {
		if (!request.session.user) {
			return response.redirect('/');
		}

		const controller = request.session.waitingForMfa ? validate : activate;
		const {error, message, success} = await controller(
			request.session.user, request.params.id, request.body.proof, request.headers.origin,
		);

		if (success) {
			if (request.session.waitingForMfa) {
				request.session.waitingForMfa = false;
				response.redirect('/');
			} else {
				response.redirect('/second-factor');
			}
		} else {
			return secondFactorProof(request, response, message ?? error);
		}
	};
}

/**
 * @param {ReturnType<typeof secondFactorProofPostController>} secondFactorProofPost
 */
function magicLinkController(secondFactorProofPost) {
	return (request, response) => {
		const [id, proof] = request.params.token.split(':');
		request.body = {proof};
		request.params = {id};
		return secondFactorProofPost(request, response);
	};
}

function logoutController(request, response) {
	request.session.destroy(error => {
		if (error) {
			response.status(500);
			response.send(error);
		} else {
			response.redirect('/');
		}
	});
}

/**
 * @param {import('express').Express} app
 * @param {{
 *   browse: BrowseController;
 *   read: ReadController;
 *   activate: ActivateController;
 *   validate: ValidateController;
 * }} simpleMfaControllers
 */
export function addRoutesTo(app, {browse, read, activate, validate}) {
	const parseBody = urlencoded({extended: false});
	app.get('/', rootController);
	app.get('/strategies', strategiesController(browse));
	app.get('/second-factor', secondFactorSelectController(browse));
	const secondFactorProof = secondFactorProofController(read);
	const secondFactorProofPost = secondFactorProofPostController(activate, validate, secondFactorProof);
	app.get('/second-factor/:id', secondFactorProof);
	app.post('/second-factor/:id', parseBody, secondFactorProofPost);
	app.get('/second-factor/magic-link/:token(*)', magicLinkController(secondFactorProofPost));
	app.get('/login', loginPageController);
	app.post('/login', parseBody, loginPostController);
	app.get('/logout', logoutController);
}
