import { defineConfig } from '@drizzle-team/shopify/cli';

export default defineConfig({
	schemaPath: 'src/schema.ts',
	shop: 'd91122',
	headers: {
		'X-Shopify-Access-Token': process.env['SHOPIFY_ADMIN_API_TOKEN']!,
	},
});
