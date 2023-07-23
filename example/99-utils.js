// @ts-check
export const loggerFor = message => {
	const WIDTH = 100;
	const START_PREFIX = '';
	const END_PREFIX = 'END';
	const START_PAD = WIDTH - (message.length + START_PREFIX.length + 1) - 2;
	const END_PAD = WIDTH - (message.length + END_PREFIX.length + 1) - 2;
	console.log('='.repeat(Math.round(START_PAD / 2)), START_PREFIX, message, '='.repeat(Math.floor(START_PAD / 2)));
	console.log('\n');
	return () => {
		console.log('\n');
		console.log('='.repeat(Math.round(END_PAD / 2)), END_PREFIX, message, '='.repeat(Math.floor(END_PAD / 2)));
		console.log('\n\n');
	};
};
