import type { ShopifyClients } from '@shopify/shopify-api';

import { createClient, tento } from '../src/client';

declare const shopifyApiClient: ShopifyClients['Graphql']['prototype'];
{
	tento({ client: shopifyApiClient, schema: {} });
}

{
	const shopifyClient = createClient({ shop: '' });
	tento({ client: shopifyClient, schema: {} });
}
