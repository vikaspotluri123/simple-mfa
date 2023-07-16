// @ts-check
import process from 'node:process';
import path from 'node:path';
import {readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import glob from 'glob';

const RULE_RELATIVE_PATH = './rules/';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @typedef {number | [line: number] | [line: number, column: number]} Location
 * @typedef {{
 *   reportError: (errorMeta: {
 *     message: string;
 *     location: Location;
 *   }) => void
 * }} RuleContext
 *
 * @typedef {(contents: string[], context: RuleContext) => void | Promise<void>} RuleImplementation
 * @typedef {{name: string, implementation: RuleImplementation}} Rule
 * @typedef {{name: string, contents: string[]}} File
 * @typedef {{rule: string, file: string, location: Location, message: string}} LintError
 * @typedef {Record<string, LintError[]>} ErrorStore
 */

async function run() {
	const rules = await Promise.all(
		readdirSync(path.resolve(__dirname, RULE_RELATIVE_PATH))
			.map(path => loadRule(path)),
	);

	const files = glob.sync(path.resolve(__dirname, '..', '**/*.md'), {ignore: '**/_*/**'});

	/** @type {ErrorStore} */
	const errors = {};

	await Promise.all(files.map(file => lintFile(file, rules, errors)));

	const errorCount = printErrors(errors);
	process.exit(errorCount); // eslint-disable-line unicorn/no-process-exit
}

await run();

/**
 * @param {string} fileName
 */
async function loadRule(fileName) {
	const absolutePath = path.resolve(__dirname, RULE_RELATIVE_PATH, fileName);
	return import(absolutePath)
		.then(module => {
			if (typeof module.lint !== 'function') {
				throw new TypeError('lint must be a function');
			}

			return {
				name: module.name ?? fileName.replace('.js', ''),
				implementation: module.lint,
			};
		})
		.catch(error => {
			console.error(`Failed loading rule ${fileName}:`);
			if (error instanceof Error) {
				console.error(`\t${error.message}`);
			} else {
				console.error(`\t${String(error)}`);
			}

			return {
				name: fileName.replace('.js', ''),
				implementation() {},
			};
		});
}

/**
 * @param {string} fileName
 * @param {Rule[]} rules
 * @param {ErrorStore} errors
 */
async function lintFile(fileName, rules, errors) {
	const fileContents = await readFile(path.resolve(__dirname, '../', fileName), 'utf8');
	const file = {
		name: fileName,
		contents: fileContents.split('\n'),
	};

	return Promise.all(rules.map(rule => runRule(file, rule, errors)));
}

/**
 * @param {File} file
 * @param {Rule} rule
 * @param {ErrorStore} errors
 */
async function runRule(file, rule, errors) {
	const context = createContext(rule.name, file.name, errors);
	try {
		await rule.implementation(file.contents, context);
	} catch (error) {
		const errorMessage = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
		context.reportError({
			message: `Rule should not error, but did: ${errorMessage}`,
			location: [0, 0],
		});
	}
}

/**
 * @param {string} rule
 * @param {string} file
 * @param {ErrorStore} store
 * @returns {RuleContext}
 */
function createContext(rule, file, store) {
	return {
		reportError({message, location}) {
			store[file] ??= [];
			store[file].push({rule, file, message, location});
		},
	};
}

/**
 * @param {ErrorStore} errorStore
 */
function printErrors(errorStore) {
	let errorCount = 0;
	for (const [file, errors] of Object.entries(errorStore)) {
		console.log(path.relative(process.cwd(), file));
		for (const error of errors) {
			errorCount++;
			let message = '\t';
			if (Array.isArray(error.location)) {
				message += error.location[1] === undefined ? error.location[0] : `${error.location[0]}:${error.location[1]}`;
			} else {
				message += String(error.location);
			}

			message += '\t';
			message += error.message;
			message += '\t';
			message += error.rule;
			console.log(message);
		}

		console.log();
	}

	return errorCount;
}
