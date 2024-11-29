import 'dotenv/config';
import '@shopify/shopify-api/adapters/node';
import express from 'express';
import { CookieNotFound, InvalidOAuthError, LATEST_API_VERSION, Session, shopifyApi } from '@shopify/shopify-api';
import * as schema from './schema';
import { tento } from '@drizzle-team/tento';

const shopify = shopifyApi({
	apiKey: process.env.SHOPIFY_API_KEY!,
	apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY!,
	scopes: process.env.SHOPIFY_SCOPES!.split(/,\s*/),
	hostName: '***.ngrok-free.app', // ngrok link
	hostScheme: 'https', // https for ngrok
	apiVersion: LATEST_API_VERSION,
	isEmbeddedApp: true,
});

async function main() {
	const app = express();

	app.use(express.json());

	// this is our future Shopify session
	let session: Session | undefined = undefined;
	const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP!;

	app.get('/auth', async (req, res) => {
		await shopify.auth.begin({
			shop: shopify.utils.sanitizeShop(SHOPIFY_SHOP, true)!,
			callbackPath: '/auth/callback',
			isOnline: false,
			rawRequest: req,
			rawResponse: res,
		});
	});

	app.get('/auth/callback', async (req, res) => {
		try {
			const callback = await shopify.auth.callback({
				rawRequest: req,
				rawResponse: res,
			});

			session = callback.session;

			return res.redirect('/');
		} catch (e: any) {
			if (e instanceof InvalidOAuthError) {
				return res.status(400).json({
					status: 'ERROR',
					message: e.message,
					code: 400,
				});
			}
			if (e instanceof CookieNotFound) {
				await shopify.auth.begin({
					shop: shopify.utils.sanitizeShop(SHOPIFY_SHOP, true)!,
					callbackPath: '/auth/callback',
					isOnline: false,
					rawRequest: req,
					rawResponse: res,
				});
			}
		}
	});

	app.get('/', async (req, res) => {
		if (!session) {
			return res.redirect('/auth');
		}

		const gqlClient = new shopify.clients.Graphql({
			session,
		});

		const client = tento({ client: gqlClient, schema });

		await client.applySchema();

		const createdDesigner = await client.metaobjects.designer.insert({
			name: 'Tento',
			description: 'Made by Drizzle team',
			website: 'https://www.google.com/',
		});

		const allProducts = await client.products.list({
			fields: {
				id: true,
				metafields: true,
			},
		});
		if (allProducts.items?.length) {
			const productsToUpdate = allProducts.items.filter(
				(product) => typeof product.metafields === 'undefined' || product.metafields.length === 0,
			);
			for await (const product of productsToUpdate) {
				await client.products.update(product.id, {
					fields: {
						metafields: {
							Designer: createdDesigner._id,
						},
					},
				});
			}
		}

		return res.json({ success: true });
	});

	app.get('/designers', async (req, res) => {
		if (!session) {
			return res.redirect('/auth');
		}

		const gqlClient = new shopify.clients.Graphql({
			session,
		});

		const client = tento({ client: gqlClient, schema });

		const designers = client.metaobjects.designer.list({
			first: 50,
		});

		return res.json(designers);
	});

	app.get('/products', async (req, res) => {
		if (!session) {
			return res.redirect('/auth');
		}

		const gqlClient = new shopify.clients.Graphql({
			session,
		});

		const client = tento({ client: gqlClient, schema });

		const productsWithMetafields = client.products.list({
			first: 10,
			query: {
				tag: 'tento',
			},
			fields: {
				id: true,
				title: true,
				metafields: true,
			},
		});

		return res.json(productsWithMetafields);
	});

	app.listen(5000, () => {
		console.log('App listening on the port 5000');
	});
}

main();
