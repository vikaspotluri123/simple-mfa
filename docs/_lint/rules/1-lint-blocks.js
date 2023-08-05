// @ts-check
import {spawn} from 'node:child_process';

const STATE_COMMENT_CHECK = 0;
const STATE_GET_BLOCK_TYPE = 1;
const STATE_BLOCK_READ = 2;

const BLOCK_CODE = 0;
const BLOCK_JAVASCRIPT_CODE = 1;
const BLOCK_TYPESCRIPT_CODE = 2;

const JAVASCRIPT_BLOCKS = new Set(['```js', '```javascript']);
const TYPESCRIPT_BLOCKS = new Set(['```ts', '```typescript']);
const CODE_BLOCKS = new Set([BLOCK_CODE, BLOCK_JAVASCRIPT_CODE, BLOCK_TYPESCRIPT_CODE]);

/**
 * @typedef {{
 *  type: number;
 *  data: string[];
 *  startingLine: number;
 * }} Block
 */

/**
 * @param {string} line
 */
function lineContainsLintComment(line) {
	// eslint-disable-next-line unicorn/prefer-string-replace-all
	const flat = line.replace(/\s+/g, '');
	if (!flat.trim().startsWith('<!--')) {
		return false;
	}

	if (flat.includes('simple-mfa:lint')) {
		return true;
	}

	return false;
}

/** @param {string} line */
function getBlockType(line) {
	const flat = line.trim().toLowerCase();

	if (JAVASCRIPT_BLOCKS.has(flat)) {
		return BLOCK_JAVASCRIPT_CODE;
	}

	if (TYPESCRIPT_BLOCKS.has(flat)) {
		return BLOCK_TYPESCRIPT_CODE;
	}

	if (flat.startsWith('```')) {
		return BLOCK_CODE;
	}

	return undefined;
}

/**
 * @param {string} line
 * @param {number} blockType
 */
function lineContainsBlockEnd(line, blockType) {
	const flat = line.trim();

	return (
		isCodeBlock(blockType) && flat === '```'
	);
}

/**
 * @param {Block | number} block
 */
function isCodeBlock(block) {
	return CODE_BLOCKS.has(typeof block === 'number' ? block : block.type);
}

/**
 * @param {string[]} contents
 * @param {import('../doc-linter.js').RuleContext} context
 */
export function lint(contents, {reportError}) {
	let state = STATE_COMMENT_CHECK;
	/** @type {number | undefined} */
	let blockType;

	/** @type {Block[]} */
	const blocksToLint = [];
	/** @type {string[]} */
	let block = [];
	/** @type {number} */
	let blockLineStart = 0;

	for (const [lineNumber, line] of contents.entries()) {
		switch (state) {
			case STATE_COMMENT_CHECK: {
				if (lineContainsLintComment(line)) {
					state = STATE_GET_BLOCK_TYPE;
					blockLineStart = lineNumber;
				}

				break;
			}

			case STATE_GET_BLOCK_TYPE: {
				blockType = getBlockType(line);
				if (blockType !== undefined) {
					block = [];
					blockLineStart = lineNumber + 1;
					state = STATE_BLOCK_READ;
				}

				break;
			}

			case STATE_BLOCK_READ: {
				blockType ??= -1;
				if (lineContainsBlockEnd(line, blockType)) {
					blocksToLint.push({type: blockType, data: block, startingLine: blockLineStart});
					state = STATE_COMMENT_CHECK;
				} else {
					block.push(line);
				}

				break;
			}
			// No default
		}
	}

	if (state !== STATE_COMMENT_CHECK) {
		reportError({message: 'Unable to find closing block', location: blockLineStart});
		return;
	}

	if (blocksToLint.length === 0) {
		return;
	}

	return Promise.all(blocksToLint.map(block => lintBlock(block, reportError)));
}

/**
 * @param {Block} block
 * @param {import('../doc-linter.js').RuleContext['reportError']} reportError
 * @returns {void | Promise<void>}
 */
function lintBlock(block, reportError) {
	if (isCodeBlock(block)) {
		// Prevent empty-line from erroring
		if (block.data.at(-1) !== '') {
			block.data.push('');
		}

		return runBlockThroughXo(block.data, block.startingLine, reportError);
	}

	reportError({message: 'Unable to lint this block', location: block.startingLine});
}

/**
 * @param {string[]} lines
 * @param {number} offset
 * @param {import('../doc-linter.js').RuleContext['reportError']} reportError
 */
function runBlockThroughXo(lines, offset, reportError) {
	return new Promise(resolve => {
		const cp = spawn('node', [
			'./node_modules/.bin/xo',
			'--stdin',
			'--stdin-filename=snippet.js',
			'--reporter=json',
		]);

		cp.stdin.write(lines.join('\n'));
		cp.stdin.end();

		let stderr = '';
		let stdout = '';

		cp.stdout.on('data', data => {
			stdout += data;
		});

		cp.stderr.on('data', data => {
			stderr += data;
		});

		cp.on('exit', code => {
			if (stderr.length > 0) {
				reportError({message: 'Linting printed to stdout', location: offset});
			}

			if (code === 0) {
				resolve(null);
				return;
			}

			const errors = JSON.parse(stdout);

			if (errors.length !== 1) {
				throw new Error('too many errors');
			}

			const {messages} = errors[0];

			for (const error of messages) {
				reportError({
					message: error.message,
					location: [error.line + offset, error.column],
					subRule: error.ruleId,
				});
			}

			resolve(null);
		});
	});
}
