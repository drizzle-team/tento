import { defineConfig } from '@drizzle-team/tento/cli';

export default defineConfig({
	schemaPath: 'src/schema.ts',
	shop: process.env['SHOP_ID']!,
	headers: {
		'X-Shopify-Access-Token': process.env['SHOPIFY_ADMIN_API_TOKEN']!,
	},
});
