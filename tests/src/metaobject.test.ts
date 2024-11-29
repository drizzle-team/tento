import config from '../tento.config';
import { initShopifyGQLClient, introspectMetaobjectDefinitionsQuery, skipTests } from './common';
import { createClient, metaobject, tento } from '@drizzle-team/tento';
import { describe, afterEach, test, expect } from 'vitest';

export const book = metaobject({
	name: 'Book',
	type: 'book',
	fieldDefinitions: (f) => ({
		title: f.singleLineTextField({
			name: 'Title',
			required: true,
		}),
		price: f.decimal({
			name: 'Price',
		}),
	}),
});

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

const schema = { book, author };

// skipTests([]);

describe('metaobject tests', () => {
	afterEach(async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema: {},
		});

		await client.applySchema();
	});

	function introspectionToConfig(
		introspection: {
			id: string;
			name: string;
			description: string | null;
			type: string;
			fieldDefinitions: Array<{
				name: string;
				required: boolean;
				description: string | null;
				key: string;
				validations: Array<{
					name: string;
					value: string | null;
				}>;
				type: {
					name: string;
				};
			}>;
		}[],
	): {
		name: string;
		type: string;
		fieldDefinitions: {
			name: string;
			description?: string;
			required?: boolean;
			type: string;
			key: string;
			validations?: {
				name: string;
				value: string | null;
			}[];
		}[];
	}[] {
		return introspection.map((node) => {
			return {
				name: node.name,
				type: node.type,
				fieldDefinitions: node.fieldDefinitions.map((field) => {
					return {
						name: field.name,
						description: field.description === null ? undefined : field.description,
						required: field.required === false ? undefined : true,
						type: field.type.name,
						key: field.key,
						validations: field.validations.length === 0 ? undefined : field.validations,
					};
				}),
			};
		});
	}

	test('migrator : default migration strategy', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const gql = await initShopifyGQLClient();
		const res = await gql.request(introspectMetaobjectDefinitionsQuery);

		const introspectionConfig = introspectionToConfig(res.data!.metaobjectDefinitions.nodes);

		expect(
			JSON.stringify(
				Object.values(schema).map((val) => {
					return val._.config;
				}),
			),
		).toEqual(JSON.stringify(introspectionConfig));
	});

	test('migrator : migrate new schema on existed', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const gql = await initShopifyGQLClient();
		const result = await gql.query({ data: { query: introspectMetaobjectDefinitionsQuery } });
		const res = result.body as any;

		const introspectionConfig = introspectionToConfig(res.data!.metaobjectDefinitions.nodes);

		expect(
			JSON.stringify(
				Object.values(schema).map((val) => {
					return val._.config;
				}),
			),
		).toEqual(JSON.stringify(introspectionConfig));

		const newSchemaClient = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema: {},
		});
		await newSchemaClient.applySchema();

		const newIntrospection = await gql.query({ data: { query: introspectMetaobjectDefinitionsQuery } });
		const newRes = newIntrospection.body as any;

		const newIntrospectionConfig = introspectionToConfig(newRes.data!.metaobjectDefinitions.nodes);

		expect(newIntrospectionConfig).toEqual([]);
	});

	test('create metaobject entity', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const createdBook = await client.metaobjects.book.insert({
			title: 'Great Work of Time',
		});

		expect(createdBook.title).toBe('Great Work of Time');
	});

	test('create metaobject entity without required field', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		await expect(
			(async () => {
				// @ts-expect-error
				await client.metaobjects.book.insert({
					price: 100,
				});
			})(),
		).rejects.toThrowError();
	});

	test('delete metaobject entity', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const createdBook = await client.metaobjects.book.insert({
			title: 'Great Work of Time',
		});

		await client.metaobjects.book.delete(createdBook._id);

		const removedBook = await client.metaobjects.book.get(createdBook._id);

		expect(removedBook).toBeUndefined();
	});

	test('update metaobject entity', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const createdBook = await client.metaobjects.book.insert({
			title: 'Great Work of Time',
		});

		const updatedBook = await client.metaobjects.book.update(createdBook._id, { fields: { title: 'Work of Time' } });

		expect(updatedBook.title).toBe('Work of Time');
		expect(updatedBook).toEqual({ ...createdBook, title: 'Work of Time', _updatedAt: updatedBook._updatedAt });
	});

	test('upsert existed metaobject entity', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const createdBook = await client.metaobjects.book.insert({
			title: 'Great Work of Time',
		});

		const updatedBook = await client.metaobjects.book.upsert(createdBook._handle, {
			fields: { title: 'Work of Time' },
		});

		expect(updatedBook.title).toBe('Work of Time');
		expect(updatedBook._handle).toBe(createdBook._handle);
		expect(updatedBook._id).toBe(createdBook._id);
		expect(updatedBook.price).toBeNull();
	});

	test('upsert not existed metaobject entity', async () => {
		const client = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema,
		});
		await client.applySchema();

		const createdBook = await client.metaobjects.book.insert({
			title: 'Great Work of Time',
		});

		await client.metaobjects.book.delete(createdBook._id);

		const upsertedBook = await client.metaobjects.book.upsert(createdBook._handle, {
			fields: { title: 'Great Work of Time' },
		});

		expect(upsertedBook.title).toBe('Great Work of Time');
		expect(upsertedBook).not.toEqual(createdBook);
		expect(upsertedBook._id).not.toBe(createdBook._id);
	});
});
