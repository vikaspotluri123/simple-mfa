// @ts-check
const message = '{} should be written as SimpleMfa';
const invalidUses = ['SimpleMFA', 'Simple MFA'];

/**
 * @param {string[]} contents
 * @param {import('../doc-linter.js').RuleContext} context
 */
export function lint(contents, {reportError}) {
	for (const [lineNumber, line] of contents.entries()) {
		for (const word of invalidUses) {
			const column = line.indexOf(word);
			if (column !== -1) {
				reportError({
					message: message.replace('{}', word),
					location: [lineNumber, column],
				});
			}
		}
	}
}
