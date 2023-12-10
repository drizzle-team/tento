import { defineConfig } from '@drizzle-team/shopify/cli';

export default defineConfig({
	schemaPath: 'src/foobar/test_schema2.ts',
	shop: 'd91122',
	headers: {
		'X-Shopify-Access-Token': process.env['SHOPIFY_ADMIN_API_TOKEN']!,
	},
});
