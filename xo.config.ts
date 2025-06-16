import {defineConfig} from 'eslint/config'; // eslint-disable-line import-x/no-extraneous-dependencies, n/no-extraneous-import

// ts-server correctly picks up the types but the eslint plugin does not
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default defineConfig([{
	rules: {
		'@stylistic/function-paren-newline': 'off',
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
	rules: {
		'@typescript-eslint/consistent-type-definitions': 'off',
		'@typescript-eslint/class-literal-property-style': 'off',
		'prefer-arrow-callback': 'off',
		'no-unused-expressions': 'off',
	},
}, {
	files: ['example/**/*.js'],
	rules: {
		'import-x/no-extraneous-dependencies': 'off',
		'n/no-extraneous-import': 'off',
		'promise/prefer-await-to-then': 'off',
	},
}]);
