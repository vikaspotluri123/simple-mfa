// @ts-check
import process from 'node:process';
import {app} from './3-app.js';

export const server = app.listen(process.env.PORT ?? 0, () => {
	let address = server.address();
	if (address.address) {
		address = `http://${address.address === '::' ? 'localhost' : address.address}:${address.port}`;
	}

	console.log(`Listening on ${address}`);
});
