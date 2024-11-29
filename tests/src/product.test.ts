import '@shopify/shopify-api/adapters/node';
import { GraphqlClient } from '@shopify/shopify-api';
import config from '../tento.config';
import {
	createCollectionQuery,
	createProductQuery,
	initShopifyGQLClient,
	removeCollectionQuery,
	removeProductQuery,
	skipTests,
	updateProductVariant,
} from './common';
import { createClient, metafield, metaobject, tento } from '@drizzle-team/tento';
import { describe, afterEach, test, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import { ProductPriceRangeV2 } from '../../src/graphql/gen/graphql';

declare module 'vitest' {
	interface TestContext {
		gql: GraphqlClient;
		products: {
			id: string;
			title: string;
			handle: string;
			vendor: string;
			publishedAt: string;
			createdAt: string;
			updatedAt: string;
		}[];
		collectionId: string;
	}
}

export const author = metaobject({
	name: 'Author',
	type: 'author',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Name',
			required: true,
		}),
		last_name: f.decimal({
			name: 'Last name',
		}),
	}),
});

export const optional_name_field = metafield({
	name: 'optional name field',
	key: 'optional_name_field',
	namespace: 'custom',
	ownerType: 'PRODUCT',
	description: '',
	pin: true,
	fieldDefinition: (f) => f.singleLineTextField(),
});

export const author_reference = metafield({
	name: 'author reference',
	key: 'author_reference',
	namespace: 'custom',
	ownerType: 'PRODUCT',
	description: 'reference on author',
	pin: true,
	fieldDefinition: (f) =>
		f.metaobjectReference({
			validations: (v) => [v.metaobjectDefinitionType(() => author.type)],
		}),
});

const schema = { author, optional_name_field, author_reference };

skipTests([
	'productType + `$or` query for inventoryTotal',
	// Even if we have retry it doesn't work...
	'`$or` query for price',
	'`$or` query for tag',
	'`$or` query for updatedAt',

	// TODO() need to change it in lib
	'title equal + `$not` for productType',
]);

let gql: GraphqlClient;
const products: {
	id: string;
	handle: string;
	vendor: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
}[] = [];
let collectionId: string;

beforeAll(async () => {
	gql = await initShopifyGQLClient();

	// create test collection
	// const createdCollection = await gql.request(createCollectionQuery, {
	//     variables: {
	//         input: {
	//             title: "Test collection",
	//             productType: "test",
	//         }
	//     }
	// });

	// collectionId = createdCollection.data.collectionCreate.collection.id;

	/**
	 * create products for test collection
	 *  - book : test
	 *  - plastic: test
	 *  - glass: test
	 *
	 *  - pull buoy: test_1
	 *  - swimming board: test_1
	 */
	const productsToAdd: {
		title: string;
		productType: string;
		price: number;
		tag: string;
		vendor: string;
	}[] = [
		{
			title: 'book',
			productType: 'test',
			price: 100.0,
			tag: 'test',
			vendor: 'Test Vendor',
		},
		{
			title: 'plastic',
			productType: 'test',
			price: 104.3,
			tag: 'test',
			vendor: 'Test Vendor',
		},
		{
			title: 'glass',
			productType: 'test',
			price: 80,
			tag: 'test',
			vendor: 'Test Vendor',
		},
		{
			title: 'pull buoy',
			productType: 'test_1',
			price: 124.3,
			tag: 'test_1',
			vendor: 'Test_1 Vendor',
		},
		{
			title: 'swimming board',
			productType: 'test_1',
			price: 20,
			tag: 'test_1',
			vendor: 'Test_1 Vendor',
		},
	];
	for (const product of productsToAdd) {
		const result = await gql.request(createProductQuery, {
			variables: {
				input: {
					title: product.title,
					productType: product.productType,
					collectionsToJoin: [collectionId],
					tags: [product.tag],
					vendor: product.vendor,
				},
			},
		});

		const { id, handle, createdAt, updatedAt, publishedAt } = result.data.productCreate.product;
		products.push({
			id,
			title: product.title,
			vendor: product.vendor,
			handle,
			createdAt,
			updatedAt,
			publishedAt,
		});
		const defaultVariantId: string = result.data.productCreate.product.variants.nodes[0].id;

		await gql.request(updateProductVariant, {
			variables: {
				productId: result.data.productCreate.product.id,
				variants: {
					id: defaultVariantId,
					price: product.price,
				},
			},
		});

		// wait 1 sec to make them
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}

	// TODO() handle it
	// wait until all variant changes is done
	// await new Promise((resolve) => setTimeout(resolve, 10000));
});

beforeEach((ctx) => {
	ctx.gql = gql;
	ctx.products = products;
	// ctx.collectionId = collectionId;
});

afterAll(async () => {
	// delete products
	for (const product of products) {
		await gql.request(removeProductQuery, {
			variables: {
				input: {
					id: product.id,
				},
			},
		});
	}

	// delete collection
	// await gql.request(removeCollectionQuery, {
	//     variables: {
	//         input: {
	//             id: collectionId,
	//         }
	//     }
	// });
});

describe('product tests', () => {
	const client = tento({
		client: createClient({
			shop: config.shop,
			headers: config.headers,
		}),
		schema,
	});

	test('list of products', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query();
		const testItems = allProducts.items.filter((item) => item.productType === 'test' || item.productType === 'test_1');

		expect(testItems).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: productType: test', async () => {
		const allProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
		});

		expect(allProducts.items).toHaveLength(3);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: with alias fields', async () => {
		const allProducts = await client.products
			.list({
				myId: 'id',
				myTitle: 'title',
				myHandle: 'handle',
			})
			.query({
				query: {
					productType: 'test',
				},
			});

		expect(allProducts.items).toHaveLength(3);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['myId', 'myTitle', 'myHandle']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: first + hasNextCursor', async () => {
		const allProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			first: 2,
		});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allProducts.pageInfo.hasNextPage).toBeTruthy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// sortKey
	test('list of products: sortKey: id (asc + desc)', async () => {
		const allProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
		});
		expect(allProducts.items).toHaveLength(3);

		const allAscSortedProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'id',
		});
		expect(allAscSortedProducts.items).toHaveLength(3);

		const allDescSortedProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'id',
			reverse: true,
		});
		expect(allDescSortedProducts.items).toHaveLength(3);

		const ascSortedItems = allAscSortedProducts.items;
		const itemsWithManualAscSort = allProducts.items
			.map((item) => {
				return {
					...item,
					id: item.id.split('gid://shopify/Product/')[1],
				};
			})
			.sort((first, second) => Number(first.id) - Number(second.id));
		expect(ascSortedItems).toEqual(
			itemsWithManualAscSort.map((item) => {
				return {
					...item,
					id: `gid://shopify/Product/${item.id}`,
				};
			}),
		);

		const descSortedItems = allDescSortedProducts.items;
		const itemsWithManualDescSort = allProducts.items
			.map((item) => {
				return {
					...item,
					id: item.id.split('gid://shopify/Product/')[1],
				};
			})
			.sort((first, second) => Number(second.id) - Number(first.id));
		expect(descSortedItems).toEqual(
			itemsWithManualDescSort.map((item) => {
				return {
					...item,
					id: `gid://shopify/Product/${item.id}`,
				};
			}),
		);
	});

	test('list of products: sortKey: created_at (asc + desc)', async () => {
		const allAscProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'created_at',
		});

		expect(allAscProducts.items).toHaveLength(3);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allAscProducts.items[0]?.title).toBe('book');
		expect(allAscProducts.items[1]?.title).toBe('plastic');
		expect(allAscProducts.items[2]?.title).toBe('glass');

		expect(allAscProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allAscProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allAscProducts.pageInfo.startCursor).not.toBeNull();
		expect(allAscProducts.pageInfo.endCursor).not.toBeNull();

		const allDescProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'created_at',
			reverse: true,
		});

		expect(allDescProducts.items).toHaveLength(3);
		expect(Object.keys(allDescProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allDescProducts.items[0]?.title).toBe('glass');
		expect(allDescProducts.items[1]?.title).toBe('plastic');
		expect(allDescProducts.items[2]?.title).toBe('book');

		expect(allDescProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allDescProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allDescProducts.pageInfo.startCursor).not.toBeNull();
		expect(allDescProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: sortKey: title (asc + desc)', async () => {
		const allAscProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'title',
		});

		expect(allAscProducts.items).toHaveLength(3);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allAscProducts.items[0]?.title).toBe('book');
		expect(allAscProducts.items[1]?.title).toBe('glass');
		expect(allAscProducts.items[2]?.title).toBe('plastic');

		expect(allAscProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allAscProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allAscProducts.pageInfo.startCursor).not.toBeNull();
		expect(allAscProducts.pageInfo.endCursor).not.toBeNull();

		const allDescProducts = await client.products.list().query({
			query: {
				productType: 'test',
			},
			sortKey: 'title',
			reverse: true,
		});

		expect(allDescProducts.items).toHaveLength(3);
		expect(Object.keys(allDescProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle']);

		expect(allDescProducts.items[0]?.title).toBe('plastic');
		expect(allDescProducts.items[1]?.title).toBe('glass');
		expect(allDescProducts.items[2]?.title).toBe('book');

		expect(allDescProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allDescProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allDescProducts.pageInfo.startCursor).not.toBeNull();
		expect(allDescProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: sortKey: product_type (asc + desc)', async () => {
		const allAscProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'product_type',
			});

		const testAscItems = allAscProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testAscItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testAscItems[0]?.title).toBe('book');
		expect(testAscItems[1]?.title).toBe('plastic');
		expect(testAscItems[2]?.title).toBe('glass');
		expect(testAscItems[3]?.title).toBe('pull buoy');
		expect(testAscItems[4]?.title).toBe('swimming board');

		expect(allAscProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allAscProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allAscProducts.pageInfo.startCursor).not.toBeNull();
		expect(allAscProducts.pageInfo.endCursor).not.toBeNull();

		const allDescProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'product_type',
				reverse: true,
			});

		const testDescItems = allDescProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testDescItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testDescItems[0]?.title).toBe('swimming board');
		expect(testDescItems[1]?.title).toBe('pull buoy');
		expect(testDescItems[2]?.title).toBe('glass');
		expect(testDescItems[3]?.title).toBe('plastic');
		expect(testDescItems[4]?.title).toBe('book');

		expect(allDescProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allDescProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allDescProducts.pageInfo.startCursor).not.toBeNull();
		expect(allDescProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: sortKey: updated_at (asc + desc)', async () => {
		const allAscProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'updated_at',
			});

		const testAscItems = allAscProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testAscItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testAscItems[0]?.title).toBe('book');
		expect(testAscItems[1]?.title).toBe('plastic');
		expect(testAscItems[2]?.title).toBe('glass');
		expect(testAscItems[3]?.title).toBe('pull buoy');
		expect(testAscItems[4]?.title).toBe('swimming board');

		expect(allAscProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allAscProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allAscProducts.pageInfo.startCursor).not.toBeNull();
		expect(allAscProducts.pageInfo.endCursor).not.toBeNull();

		const allDescProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'updated_at',
				reverse: true,
			});

		const testDescItems = allDescProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testDescItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testDescItems[0]?.title).toBe('swimming board');
		expect(testDescItems[1]?.title).toBe('pull buoy');
		expect(testDescItems[2]?.title).toBe('glass');
		expect(testDescItems[3]?.title).toBe('plastic');
		expect(testDescItems[4]?.title).toBe('book');

		expect(allDescProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allDescProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allDescProducts.pageInfo.startCursor).not.toBeNull();
		expect(allDescProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('list of products: sortKey: vendor (asc + desc)', async () => {
		const allAscProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'vendor',
			});

		const testAscItems = allAscProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testAscItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testAscItems[0]?.title).toBe('book');
		expect(testAscItems[1]?.title).toBe('plastic');
		expect(testAscItems[2]?.title).toBe('glass');
		expect(testAscItems[3]?.title).toBe('pull buoy');
		expect(testAscItems[4]?.title).toBe('swimming board');

		expect(allAscProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allAscProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allAscProducts.pageInfo.startCursor).not.toBeNull();
		expect(allAscProducts.pageInfo.endCursor).not.toBeNull();

		const allDescProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				sortKey: 'vendor',
				reverse: true,
			});

		const testDescItems = allDescProducts.items.filter(
			(item) => item.productType === 'test' || item.productType === 'test_1',
		);

		expect(testDescItems).toHaveLength(5);
		expect(Object.keys(allAscProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(testDescItems[0]?.title).toBe('swimming board');
		expect(testDescItems[1]?.title).toBe('pull buoy');
		expect(testDescItems[2]?.title).toBe('glass');
		expect(testDescItems[3]?.title).toBe('plastic');
		expect(testDescItems[4]?.title).toBe('book');

		expect(allDescProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allDescProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allDescProducts.pageInfo.startCursor).not.toBeNull();
		expect(allDescProducts.pageInfo.endCursor).not.toBeNull();
	});

	// TODO() add other sortKey: 'inventory_total' | 'published_at' | 'relevance'

	/**
	 * What's left for query ($or):
	 *  - default
	 *  - barcode
	 *  - categoryId
	 *  - deliveryProfileId
	 *  - productConfigurationOwner
	 *  - sku
	 *  - publishedAt
	 */
	test('`$or` query for productType', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							productType: 'test',
						},
						{
							productType: 'test_1',
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[1]?.title).toBe('plastic');
		expect(allProducts.items[2]?.title).toBe('glass');
		expect(allProducts.items[3]?.title).toBe('pull buoy');
		expect(allProducts.items[4]?.title).toBe('swimming board');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for title', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							title: 'book',
						},
						{
							title: 'pull buoy',
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');

		expect(allProducts.items[1]?.title).toBe('pull buoy');
		expect(allProducts.items[1]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for price', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
						price: ProductPriceRangeV2;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		while (!doesProductsExists && typeof allProducts === 'undefined') {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
					price: 'priceRangeV2',
				})
				.query({
					query: [
						{
							$or: [
								{
									price: 1,
								},
								{
									price: 80,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		expect(allProducts!.items).toHaveLength(1);
		expect(Object.keys(allProducts!.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType', 'price']);

		expect(allProducts!.items[0]?.title).toBe('glass');
		expect(allProducts!.items[0]?.productType).toBe('test');
		expect(Number(allProducts!.items[0]?.price.maxVariantPrice.amount)).toBe(80);
		expect(allProducts!.items[0]?.price.maxVariantPrice.currencyCode).toBe('UAH');

		expect(allProducts!.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts!.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts!.pageInfo.startCursor).not.toBeNull();
		expect(allProducts!.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for tag', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		while (!doesProductsExists && typeof allProducts === 'undefined') {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: {
						$or: [
							{
								tag: 'test',
							},
							{
								tag: 'test_1',
							},
						],
					},
				});

			if (allProducts.items?.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		expect(allProducts!.items).toHaveLength(5);
		expect(Object.keys(allProducts!.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts!.items[0]?.title).toBe('book');
		expect(allProducts!.items[1]?.title).toBe('plastic');
		expect(allProducts!.items[2]?.title).toBe('glass');
		expect(allProducts!.items[3]?.title).toBe('pull buoy');
		expect(allProducts!.items[4]?.title).toBe('swimming board');

		expect(allProducts!.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts!.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts!.pageInfo.startCursor).not.toBeNull();
		expect(allProducts!.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for tagNot', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		while (!doesProductsExists && typeof allProducts === 'undefined') {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									tagNot: 'test',
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items?.length === 2) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		expect(allProducts!.items).toHaveLength(2);
		expect(Object.keys(allProducts!.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts!.items[0]?.title).toBe('pull buoy');
		expect(allProducts!.items[1]?.title).toBe('swimming board');

		expect(allProducts!.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts!.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts!.pageInfo.startCursor).not.toBeNull();
		expect(allProducts!.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for createdAt', async () => {
		const book = products.find((product) => product.title === 'book')!;
		const pullBuoy = products.find((product) => product.title === 'pull buoy')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							createdAt: book.createdAt,
						},
						{
							createdAt: pullBuoy.createdAt,
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');
		expect(allProducts.items[1]?.title).toBe('pull buoy');
		expect(allProducts.items[1]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for updatedAt', async () => {
		const book = products.find((product) => product.title === 'book')!;
		const swimmingBoard = products.find((product) => product.title === 'swimming board')!;

		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		while (!doesProductsExists && typeof allProducts === 'undefined') {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: {
						$or: [
							{
								updatedAt: book.updatedAt,
							},
							{
								updatedAt: swimmingBoard.updatedAt,
							},
						],
					},
				});

			if (allProducts.items?.length === 2) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}

		expect(allProducts!.items).toHaveLength(2);
		expect(Object.keys(allProducts!.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts!.items[0]?.title).toBe('book');
		expect(allProducts!.items[0]?.productType).toBe('test');
		expect(allProducts!.items[1]?.title).toBe('swimming board');
		expect(allProducts!.items[1]?.productType).toBe('test_1');

		expect(allProducts!.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts!.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts!.pageInfo.startCursor).not.toBeNull();
		expect(allProducts!.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for status', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						$or: [
							{
								status: 'ACTIVE',
							},
							{
								status: 'ARCHIVED',
							},
						],
					},
					{
						$or: [
							{
								productType: 'test',
							},
							{
								productType: 'test_1',
							},
						],
					},
				],
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[1]?.title).toBe('plastic');
		expect(allProducts.items[2]?.title).toBe('glass');
		expect(allProducts.items[3]?.title).toBe('pull buoy');
		expect(allProducts.items[4]?.title).toBe('swimming board');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for id', async () => {
		const book = products.find((product) => product.title === 'book')!;
		const swimmingBoard = products.find((product) => product.title === 'swimming board')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							id: book.id.split('gid://shopify/Product/')[1],
						},
						{
							id: swimmingBoard.id.split('gid://shopify/Product/')[1],
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');
		expect(allProducts.items[1]?.title).toBe('swimming board');
		expect(allProducts.items[1]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for handle', async () => {
		const book = products.find((product) => product.title === 'book')!;
		const swimmingBoard = products.find((product) => product.title === 'swimming board')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							handle: book.handle,
						},
						{
							handle: swimmingBoard.handle,
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');
		expect(allProducts.items[1]?.title).toBe('swimming board');
		expect(allProducts.items[1]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$or` query for vendor', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$or: [
						{
							vendor: 'Test Vendor',
						},
						{
							vendor: 'Test_1 Vendor',
						},
					],
				},
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// and
	test('productType + `$or` query for title', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						$or: [
							{
								title: 'book',
							},
							{
								title: 'pull buoy',
							},
						],
					},
					{
						productType: 'test_1',
					},
				],
			});

		expect(allProducts.items).toHaveLength(1);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('pull buoy');
		expect(allProducts.items[0]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for publishedStatus', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						$or: [
							{
								publishedStatus: 'APPROVED',
							},
							{
								publishedStatus: 'APPROVED',
							},
						],
					},
					{
						$or: [
							{
								productType: 'test',
							},
							{
								productType: 'test_1',
							},
						],
					},
				],
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for publishableStatus', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						$or: [
							{
								publishableStatus: 'PUBLISHED',
							},
							{
								publishableStatus: 'PUBLISHED',
							},
						],
					},
					{
						$or: [
							{
								productType: 'test',
							},
							{
								productType: 'test_1',
							},
						],
					},
				],
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// TODO() doesn't work
	test('productType + `$or` query for inventoryTotal', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									inventoryTotal: 0,
								},
								{
									inventoryTotal: 1,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items?.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// test('productType + `$or` query for combinedListingRole', async () => {
	//     const allProducts = await client.products.list({
	//         id: 'id',
	//         title: 'title',
	//         handle: 'handle',
	//         productType: 'productType',
	//     }).query({
	//         query: [
	//             {
	//                 $or: [
	//                     {
	//                         combinedListingRole: 'parent',
	//                     },
	//                     {
	//                         combinedListingRole: 'parent',
	//                     }
	//                 ]
	//             },
	//             {
	//                 $or: [
	//                     {
	//                         productType: 'test',
	//                     },
	//                     {
	//                         productType: 'test_1',
	//                     }
	//                 ]
	//             }
	//         ]
	//     });

	//     expect(allProducts.items).toHaveLength(5);
	//     expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

	//     expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
	//     expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
	//     expect(allProducts.pageInfo.startCursor).not.toBeNull();
	//     expect(allProducts.pageInfo.endCursor).not.toBeNull();
	// });

	// TODO() doesn't work
	test('productType + `$or` query for hasOnlyDefaultVariant', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									hasOnlyDefaultVariant: true,
								},
								{
									hasOnlyDefaultVariant: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items?.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for hasOnlyComposites', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									hasOnlyComposites: true,
								},
								{
									hasOnlyComposites: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for bundles', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									bundles: true,
								},
								{
									bundles: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for giftCard', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						$or: [
							{
								giftCard: true,
							},
							{
								giftCard: false,
							},
						],
					},
					{
						$or: [
							{
								productType: 'test',
							},
							{
								productType: 'test_1',
							},
						],
					},
				],
			});

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for hasVariantWithComponents', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									hasVariantWithComponents: true,
								},
								{
									hasVariantWithComponents: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0 && allProducts.items.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for isPriceReduced', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									isPriceReduced: true,
								},
								{
									isPriceReduced: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0 && allProducts.items.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType + `$or` query for outOfStockSomewhere', async () => {
		let doesProductsExists = false;
		let allProducts:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		do {
			allProducts = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
				})
				.query({
					query: [
						{
							$or: [
								{
									outOfStockSomewhere: true,
								},
								{
									outOfStockSomewhere: false,
								},
							],
						},
						{
							$or: [
								{
									productType: 'test',
								},
								{
									productType: 'test_1',
								},
							],
						},
					],
				});

			if (allProducts.items.length > 0 && allProducts.items.length === 5) {
				doesProductsExists = true;
			} else {
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		} while (!doesProductsExists && typeof allProducts === 'undefined');

		expect(allProducts.items).toHaveLength(5);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// TODO() Need to change it
	test('title equal + `$not` for productType', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						title: 'pull buoy',
					},
					{
						productType: {
							$not: 'test',
						},
					},
				],
			});

		expect(allProducts.items).toHaveLength(1);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('pull buoy');
		expect(allProducts.items[0]?.productType).toBe('test_1');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType equal + `$lt` for createdAt', async () => {
		const glass = products.find((product) => product.title === 'glass')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						productType: 'test',
					},
					{
						createdAt: {
							$lt: glass.createdAt,
						},
					},
				],
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[1]?.title).toBe('plastic');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType equal + `$lte` for createdAt', async () => {
		const glass = products.find((product) => product.title === 'glass')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						productType: 'test',
					},
					{
						createdAt: {
							$lte: glass.createdAt,
						},
					},
				],
			});

		expect(allProducts.items).toHaveLength(3);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[1]?.title).toBe('plastic');
		expect(allProducts.items[2]?.title).toBe('glass');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType equal + `$gt` for createdAt', async () => {
		const book = products.find((product) => product.title === 'book')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						productType: 'test',
					},
					{
						createdAt: {
							$gt: book.createdAt,
						},
					},
				],
			});

		expect(allProducts.items).toHaveLength(2);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('plastic');
		expect(allProducts.items[1]?.title).toBe('glass');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType equal + `$gte` for createdAt', async () => {
		const book = products.find((product) => product.title === 'book')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						productType: 'test',
					},
					{
						createdAt: {
							$gte: book.createdAt,
						},
					},
				],
			});

		expect(allProducts.items).toHaveLength(3);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[1]?.title).toBe('plastic');
		expect(allProducts.items[2]?.title).toBe('glass');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('productType equal + createdAt: `$gte` + updatedAt: `$lte` + title', async () => {
		const book = products.find((product) => product.title === 'book')!;
		const glass = products.find((product) => product.title === 'glass')!;
		const plastic = products.find((product) => product.title === 'plastic')!;

		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: [
					{
						productType: 'test',
					},
					{
						createdAt: {
							$gte: book.createdAt,
						},
					},
					{
						createdAt: {
							$lte: glass.createdAt,
						},
					},
					{
						title: plastic.title,
					},
				],
			});

		expect(allProducts.items).toHaveLength(1);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('plastic');
		expect(allProducts.items[0]?.productType).toBe('test');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// $raw
	test('`$raw` query', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$raw: 'book',
				},
			});

		expect(allProducts.items).toHaveLength(1);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	test('`$raw` query productType', async () => {
		const allProducts = await client.products
			.list({
				id: 'id',
				title: 'title',
				handle: 'handle',
				productType: 'productType',
			})
			.query({
				query: {
					$raw: 'product_type:"test"',
				},
			});

		expect(allProducts.items).toHaveLength(3);
		expect(Object.keys(allProducts.items[0]!)).toStrictEqual(['id', 'title', 'handle', 'productType']);

		expect(allProducts.items[0]?.title).toBe('book');
		expect(allProducts.items[0]?.productType).toBe('test');
		expect(allProducts.items[1]?.title).toBe('plastic');
		expect(allProducts.items[2]?.title).toBe('glass');

		expect(allProducts.pageInfo.hasNextPage).toBeFalsy();
		expect(allProducts.pageInfo.hasPreviousPage).toBeFalsy();
		expect(allProducts.pageInfo.startCursor).not.toBeNull();
		expect(allProducts.pageInfo.endCursor).not.toBeNull();
	});

	// update
	test('update title', async () => {
		const book = products.find((product) => product.title === 'book')!;

		await client.products.update(book.id).set({
			fields: {
				title: 'new book',
			},
		});

		let bookProduct:
			| {
					items: {
						id: string;
						title: string;
						handle: string;
						productType: string;
						createdAt: Date;
						updatedAt: Date;
					}[];
					pageInfo: {
						startCursor: string;
						endCursor: string;
						hasNextPage: boolean;
						hasPreviousPage: boolean;
					};
			  }
			| undefined = undefined;
		const doesProductsExists = false;
		while (!doesProductsExists && typeof bookProduct === 'undefined') {
			bookProduct = await client.products
				.list({
					id: 'id',
					title: 'title',
					handle: 'handle',
					productType: 'productType',
					createdAt: 'createdAt',
					updatedAt: 'updatedAt',
				})
				.query({
					query: {
						id: book.id,
					},
				});
		}

		expect(bookProduct!.items).toHaveLength(1);
		expect(Object.keys(bookProduct!.items[0]!)).toStrictEqual([
			'id',
			'title',
			'handle',
			'productType',
			'createdAt',
			'updatedAt',
		]);

		expect(bookProduct!.items[0]?.title).toBe('new book');
		expect(bookProduct!.items[0]?.productType).toBe('test');
		expect(bookProduct!.items[0]?.id).toBe(book.id);
		expect(bookProduct!.items[0]?.handle).toBe(book.handle);
		expect(bookProduct!.items[0]?.createdAt).toBe(book.createdAt);

		expect(bookProduct!.items[0]).not.toEqual({
			id: book.id,
			title: book.title,
			handle: book.handle,
			productType: 'test',
			createdAt: book.createdAt,
			updatedAt: book.updatedAt,
		});

		expect(bookProduct!.pageInfo.hasNextPage).toBeFalsy();
		expect(bookProduct!.pageInfo.hasPreviousPage).toBeFalsy();
		expect(bookProduct!.pageInfo.startCursor).not.toBeNull();
		expect(bookProduct!.pageInfo.endCursor).not.toBeNull();
	});
});
