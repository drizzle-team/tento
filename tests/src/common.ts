import '@shopify/shopify-api/adapters/node';
import { LATEST_API_VERSION, Session, shopifyApi } from '@shopify/shopify-api';
import config from '../tento.config';
import { beforeEach } from 'vitest';

export async function initShopifyGQLClient() {
	const shopify = shopifyApi({
		apiKey: process.env['SHOPIFY_API_KEY']!,
		apiSecretKey: process.env['SHOPIFY_API_SECRET_KEY']!,
		scopes: [
			'write_products',
			'read_products',
			'write_metaobject_definitions',
			'read_metaobject_definitions',
			'write_metaobjects',
			'read_metaobjects',
		],
		hostName: '1fbb-159-224-232-185.ngrok-free.app',
		hostScheme: 'https',
		apiVersion: LATEST_API_VERSION,
		isEmbeddedApp: true,
		future: {
			lineItemBilling: true,
			customerAddressDefaultFix: true,
		},
	});

	const session = new Session({
		id: `offline_${config.shop}.myshopify.com`,
		shop: `${config.shop}.config.shop`,
		state: '638921041849883',
		isOnline: false,
		accessToken: config.headers['X-Shopify-Access-Token'],
		scope: 'write_metaobject_definitions,write_metaobjects,write_products',
	});

	return new shopify.clients.Graphql({ session });
}

export function skipTests(names: string[]) {
	beforeEach((ctx) => {
		if (names.includes(ctx.task.name)) {
			ctx.skip();
		}
	});
}

export const introspectMetaobjectDefinitionsQuery = `
    query Introspection {
    	metaobjectDefinitions(first: 100) {
    		nodes {
    			name
    			type
    			fieldDefinitions {
    				name
    				required
    				description
    				validations {
    					name
    					value
    				}
    				type {
    					name
    				}
    				key
    			}
    		}
    	}
    }
`;

export const introspectMetafieldDefinitionsQuery = `
    query Introspection($query: String) {
		metafieldDefinitions(first: 100, ownerType: PRODUCT, query: $query) {
			nodes {
                name
                key
                namespace
				ownerType
                type { name }
                pinnedPosition
                validations {
                    name
                    value
                }
			}
		}
	}
`;

export const createProductQuery = `
    mutation CreateProduct($input: ProductInput!) {
    	productCreate(input: $input) {
            product {
                id
                title
                handle
                createdAt
                updatedAt
                publishedAt
                variants (first: 5) {
                    nodes {
                        id
                    }
                }
            }
            userErrors {
                field
                message
            }
    	}
    }
`;

export const removeProductQuery = `
    mutation DeleteProduct($input: ProductDeleteInput!) {
    	productDelete(input: $input) {
            userErrors {
                field
                message
            }
    	}
    }
`;

export const updateProductVariant = `
    mutation UpdateProductVariantsOptionValuesInBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors {
          field
          message
        }
      }
    }
`;

export const createCollectionQuery = `
    mutation CreateCollection($input: CollectionInput!) {
    	collectionCreate(input: $input) {
            collection {
                id
            }
            userErrors {
                field
                message
            }
    	}
    }
`;

export const removeCollectionQuery = `
    mutation DeleteCollection($input: CollectionDeleteInput!) {
    	collectionDelete(input: $input) {
            userErrors {
                field
                message
            }
    	}
    }
`;
