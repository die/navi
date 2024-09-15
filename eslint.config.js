const globals = require('globals');

module.exports = [
	{
		files: ['**/*.js'],
		languageOptions: {
			sourceType: 'commonjs',
			globals: globals.node,
		},
		rules: {
			curly: ['error', 'multi-line', 'consistent'],
			'handle-callback-err': 'off',
			'max-nested-callbacks': ['error', { max: 4 }],
			'no-console': 'off',
			'no-empty-function': 'error',
			'no-inline-comments': 'error',
			'no-lonely-if': 'error',
			'no-shadow': ['error', { allow: ['err', 'resolve', 'reject'] }],
			'no-var': 'error',
			'prefer-const': 'error',
			quotes: ['error', 'single', { avoidEscape: true }],
			'spaced-comment': 'error',
			yoda: 'error',
		},
	},
];
