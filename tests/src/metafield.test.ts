import config from '../tento.config';
import { initShopifyGQLClient, introspectMetafieldDefinitionsQuery, skipTests } from './common';
import { createClient, metafield, metaobject, tento } from '@drizzle-team/tento';
import { describe, afterEach, test, expect } from 'vitest';

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

skipTests(['migrator : default migration strategy', 'migrator : migrate new schema on existed']);

describe('metafield tests', () => {
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
		const result = await gql.query({ data: { query: introspectMetafieldDefinitionsQuery } });
		const res = result.body as any;

		const introspectionConfig = introspectionToConfig(res.data!.metafieldDefinitions.nodes);

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
		const result = await gql.query({ data: { query: introspectMetafieldDefinitionsQuery } });
		const res = result.body as any;

		const introspectionConfig = introspectionToConfig(res.data!.metafieldDefinitions.nodes);

		expect(introspectionConfig).toEqual(
			JSON.stringify(
				Object.values(schema).map((val) => {
					return val._.config;
				}),
			),
		);

		const newSchemaClient = tento({
			client: createClient({
				shop: config.shop,
				headers: config.headers,
			}),
			schema: {},
		});
		await newSchemaClient.applySchema();

		const newIntrospection = await gql.query({ data: { query: introspectMetafieldDefinitionsQuery } });
		const newRes = newIntrospection.body as any;

		const newintrospectionConfig = introspectionToConfig(newRes.data!.metafieldDefinitions.nodes);

		expect(newintrospectionConfig).toEqual([]);
	});
});
