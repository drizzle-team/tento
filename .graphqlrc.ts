import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: 'https://shopify.dev/admin-graphql-direct-proxy',
	documents: ['src/cli/**/*.ts', 'src/client/**/*.ts'],
	generates: {
		// 'src/graphql/gen/types.ts': {
		// 	plugins: ['typescript', 'typescript-operations'],
		// 	config: {
		// 		avoidOptionals: {
		// 			field: true,
		// 			inputValue: false,
		// 			object: true,
		// 			defaultValue: true,
		// 		},
		// 		useTypeImports: true,
		// 		skipTypename: true,
		// 		preResolveTypes: false,
		// 	},
		// },
		'src/graphql/gen/': {
			preset: 'client',
			config: {
				avoidOptionals: {
					field: true,
					inputValue: false,
					object: true,
					defaultValue: true,
				},
				useTypeImports: true,
				skipTypename: true,
				documentMode: 'string',
			},
		},
	},
};

export default config;
