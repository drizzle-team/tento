import 'dotenv/config';
import '@shopify/shopify-api/adapters/web-api';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { ApiVersion, Session, shopifyApi } from '@shopify/shopify-api';
import { parseEnv, z } from 'znv';
import { tento } from '@drizzle-team/tento';

import * as schema from './schema';

const env = parseEnv(process.env, {
	SHOPIFY_API_KEY: z.string(),
	SHOPIFY_API_SECRET_KEY: z.string(),
	SHOPIFY_SCOPES: z.string().transform((scopes) => scopes.split(/,\s*/)),
	SHOPIFY_SHOP: z.string(),
});

const shopify = shopifyApi({
	apiKey: env.SHOPIFY_API_KEY,
	apiSecretKey: env.SHOPIFY_API_SECRET_KEY,
	scopes: env.SHOPIFY_SCOPES as string[],
	hostName: 'localhost:3000',
	hostScheme: 'http',
	apiVersion: ApiVersion.October23,
	isEmbeddedApp: true,
});

let session: Session | undefined;

const app = new Hono();
app.get('/auth', async (c) => {
	const shop = shopify.utils.sanitizeShop(env.SHOPIFY_SHOP, true)!;
	return await shopify.auth.begin({
		shop,
		callbackPath: '/auth/callback',
		isOnline: false,
		rawRequest: c.req,
	});
});

app.get('/auth/callback', async (c) => {
	const callback = await shopify.auth.callback({
		rawRequest: c.req,
		rawResponse: c.res,
	});

	session = callback.session;

	return c.redirect('/');
});

app.get('/', async (c) => {
	if (!session) {
		return c.redirect('/auth');
	}

	return c.json(session);
});

app.get('/apply', async (c) => {
	if (!session) {
		return c.redirect('/auth');
	}

	const gqlClient = new shopify.clients.Graphql({
		session,
	});

	const client = tento({ client: gqlClient, schema });

	await client.applySchema();

	return c.json({ success: true });
});

app.get('/books', async (c) => {
	if (!session) {
		return c.redirect('/auth');
	}

	const gqlClient = new shopify.clients.Graphql({
		session,
	});

	const client = tento({ client: gqlClient, schema });

	const booksIt = client.metaobjects.book.iterator({
		pageSize: 50,
	});
	const books = [];
	for await (const book of booksIt) {
		books.push(book);
	}

	return c.json(books);
});

serve(app);
