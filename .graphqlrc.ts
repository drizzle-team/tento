import { ApiType, shopifyApiProject } from '@shopify/api-codegen-preset';

export default {
	schema: 'https://shopify.dev/storefront-graphql-direct-proxy',
	documents: ['src/cli/**/*.ts', 'src/client/**/*.ts'],
	projects: {
		default: shopifyApiProject({
			apiType: ApiType.Admin,
			apiVersion: '2023-10',
			outputDir: 'src/graphql/gen/types',
		}),
	},
};
