import { ApiType, shopifyApiProject } from '@shopify/api-codegen-preset';

export default {
	schema: 'https://shopify.dev/storefront-graphql-direct-proxy',
	documents: ['packages/**/*.ts', '!**/node_modules'],
	projects: {
		default: shopifyApiProject({
			apiType: ApiType.Admin,
			apiVersion: '2023-10',
			outputDir: 'packages/graphql/gen/types',
		}),
	},
};
