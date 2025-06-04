import {defineConfig} from 'eslint/config'; // eslint-disable-line import-x/no-extraneous-dependencies, n/no-extraneous-import

export default defineConfig([{
	rules: {
		'@typescript-eslint/naming-convention': 'off',
		'@typescript-eslint/consistent-type-definitions': [
			'error',
			'interface',
		],
		'@typescript-eslint/class-literal-property-style': [
			'error',
			'fields',
		],
		'n/file-extension-in-import': 'off',
		'prefer-object-has-own': 'warn',
	},
}, {
	files: ['test/**/*.js'],
	languageOptions: {
		globals: {
			before: 'readable',
			beforeEach: 'readable',
			after: 'readable',
			afterEach: 'readable',
			describe: 'readable',
			it: 'readable',
		},
	},
	rules: {
		'@typescript-eslint/consistent-type-definitions': 'off',
		'@typescript-eslint/class-literal-property-style': 'off',
		'prefer-arrow-callback': 'off',
		'no-unused-expressions': 'off',
	},
}]);
