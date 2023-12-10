import { Metaobject } from './metaobject';
import type {
	ExtractSchema,
	IteratorConfig,
	KnownKeysOnly,
	ListConfig,
	ListConfigFields,
	ListConfigQuery,
	ListConfigQueryItem,
	ListResult,
	ResultItem,
	UpdateConfig,
} from './types';
import { Field, dateTime, singleLineTextField } from './field';

import type {
	InputMaybe,
	MetaobjectCapabilityDataInput,
	MetaobjectUpdateInput,
	MetaobjectUserError,
} from 'src/graphql/gen/graphql';
import { graphql } from 'src/graphql/gen';
import { createGQLClient, type GQLClient } from './gql-client';

export class ShopifyBase<TSchema extends Record<string, Metaobject<any>>> {
	readonly _: {
		readonly client: GQLClient;
		readonly schema: TSchema;
	};

	constructor(client: GQLClient, schema: TSchema) {
		this._ = { client, schema };
	}
}

const metaFields: Record<string, Field<any>> = {
	_id: singleLineTextField(),
	_handle: singleLineTextField(),
	_updatedAt: dateTime(),
};

const metaFieldNames = Object.keys(metaFields);

export class ShopifyOperations<T extends Metaobject<any>> {
	readonly _: {
		readonly metaobject: T;
	};

	declare readonly $inferSelect: T['$inferSelect'];
	declare readonly $inferInsert: T['$inferInsert'];
	declare readonly $inferUpdate: T['$inferUpdate'];

	constructor(metaobject: T, private client: GQLClient) {
		this._ = { metaobject };
	}

	private getSelectedFields(fields: ListConfigFields<T> | undefined): Record<string, true> {
		if (!fields) {
			return [...Object.keys(this._.metaobject.fieldKeysMap), ...metaFieldNames].reduce<Record<string, true>>(
				(acc, key) => {
					acc[key] = true;
					return acc;
				},
				{},
			);
		}

		let isExcludeMode = true;
		const selectedFields: Record<string, true> = {};
		for (const [key, value] of Object.entries(fields ?? {})) {
			if (value) {
				isExcludeMode = false;
			}
			selectedFields[key] = true;
		}
		if (Object.keys(selectedFields).length === 0) {
			throw new Error('At least one field must be selected');
		}
		if (isExcludeMode) {
			const result: Record<string, true> = {};
			for (const field of [...Object.keys(this._.metaobject.fieldKeysMap), ...metaFieldNames]) {
				if (!(field in selectedFields)) {
					result[field] = true;
				}
			}
			return result;
		}

		return selectedFields;
	}

	private mapItemResult<TFields extends ListConfigFields<T>>(
		node: any,
		allSelectedFieldsMap: Record<string, true>,
		selectedFields: string[],
	): ResultItem<T, TFields> {
		const result: Record<string, unknown> = {};
		for (const key of metaFieldNames) {
			if (allSelectedFieldsMap[key]) {
				result[key] = metaFields[key]!.fromAPIValue(node[key]);
			}
		}
		for (let i = 0; i < selectedFields.length; i++) {
			const key = selectedFields[i]!;
			const rawValue = node[`field${i}`]?.value ?? null;
			result[key] = rawValue === null ? rawValue : this._.metaobject.fields[key]!.fromAPIValue(node[`field${i}`].value);
		}
		return result as any;
	}

	private buildItemSelection(allSelectedFieldsMap: Record<string, true>, selectedFields: string[]): string {
		return `${metaFieldNames
			.map((f) => (f in allSelectedFieldsMap ? `${f}: ${f.replace(/^_/, '')}` : undefined))
			.filter((f) => f !== undefined)
			.join(', ')}
		${selectedFields.map((_, i) => `field${i}: field(key: $field${i}) { value }`).join(', ')}`;
	}

	async list<TConfig extends ListConfig<T>>(
		config: KnownKeysOnly<TConfig, ListConfig<T>>,
	): Promise<ListResult<T, TConfig['fields']>> {
		const allSelectedFieldsMap = this.getSelectedFields(config.fields);
		const allSelectedFields = Object.keys(allSelectedFieldsMap);
		const selectedFields = allSelectedFields.filter((f) => !metaFieldNames.includes(f));

		const query = `
			query ListMetaobjects($type: String!, $query: String, $after: String, $before: String, $first: Int, $last: Int, $reverse: Boolean, $sortKey: String, ${selectedFields
				.map((_, i) => `$field${i}: String!`)
				.join(', ')}) {
				metaobjects(type: $type, query: $query, after: $after, before: $before, first: $first, last: $last, reverse: $reverse, sortKey: $sortKey) {
					edges {
						node {
							${this.buildItemSelection(allSelectedFieldsMap, selectedFields)}
						}
					}
					pageInfo {
						startCursor, endCursor, hasNextPage, hasPreviousPage
					}
				}
			}
		`;

		const response = await this.client(query, {
			type: this._.metaobject._.config.type,
			query: buildListQuery(config.query),
			after: config.after,
			before: config.before,
			first: config.first,
			last: config.last,
			reverse: config.reverse,
			sortKey: config.sortKey,
			...Object.fromEntries(selectedFields.map((f, i) => [`field${i}`, this._.metaobject.fieldKeysMap[f]])),
		});

		if (response.errors) {
			throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		const items = response.data.metaobjects.edges.map((edge: any) =>
			this.mapItemResult(edge.node, allSelectedFieldsMap, selectedFields),
		);

		return {
			items,
			pageInfo: response.data.metaobjects.pageInfo,
		};
	}

	async get<TFields extends ListConfigFields<T> = Record<keyof T['$inferSelect'], true>>(
		id: string,
		fields?: KnownKeysOnly<TFields, ListConfigFields<T>>,
	): Promise<ResultItem<T, TFields> | undefined> {
		const allSelectedFieldsMap = this.getSelectedFields(fields);
		const allSelectedFields = Object.keys(allSelectedFieldsMap);
		const selectedFields = allSelectedFields.filter((f) => !metaFieldNames.includes(f));

		const query = `
			query GetMetaobject($id: ID!, ${selectedFields.map((_, i) => `$field${i}: String!`).join(', ')}) {
				metaobject(id: $id) {
					${this.buildItemSelection(allSelectedFieldsMap, selectedFields)}
				}
			}`;

		const response = await this.client(query, {
			id,
			...Object.fromEntries(selectedFields.map((f, i) => [`field${i}`, this._.metaobject.fieldKeysMap[f]])),
		});

		if (response.errors) {
			throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (!response.data.metaobject) {
			return undefined;
		}

		return this.mapItemResult(response.data.metaobject, allSelectedFieldsMap, selectedFields);
	}

	async *iterator<TConfig extends IteratorConfig<T>>(
		config: KnownKeysOnly<TConfig, IteratorConfig<T>>,
	): AsyncGenerator<ResultItem<T, TConfig['fields']>, void, unknown> {
		const allSelectedFieldsMap = this.getSelectedFields(config.fields);
		const allSelectedFields = Object.keys(allSelectedFieldsMap);
		const selectedFields = allSelectedFields.filter((f) => !metaFieldNames.includes(f));

		let cursor: string | undefined;
		let hasNextPage = config.limit ? config.limit > 0 : true;
		const pageSize = config.pageSize ?? 100;

		while (hasNextPage) {
			const query = `
					query ListMetaobjects($type: String!, $query: String, $after: String, $first: Int, $reverse: Boolean, $sortKey: String, ${selectedFields
						.map((_, i) => `$field${i}: String!`)
						.join(', ')}) {
						metaobjects(type: $type, query: $query, after: $after, first: $first, reverse: $reverse, sortKey: $sortKey) {
							edges {
								node {
									${this.buildItemSelection(allSelectedFieldsMap, selectedFields)}
								}
							}
							pageInfo {
								startCursor, endCursor, hasNextPage, hasPreviousPage
							}
						}
					}`;

			const response = await this.client(query, {
				type: this._.metaobject._.config.type,
				query: buildListQuery(config.query),
				after: cursor,
				first: pageSize,
				reverse: config.reverse,
				sortKey: config.sortKey,
				...Object.fromEntries(selectedFields.map((f, i) => [`field${i}`, this._.metaobject.fieldKeysMap[f]])),
			});

			if (response.errors) {
				throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
			}

			for (const edge of response.data.metaobjects.edges) {
				yield this.mapItemResult(edge.node, allSelectedFieldsMap, selectedFields) as any;
			}

			cursor = response.data.metaobjects.pageInfo.endCursor;
			hasNextPage = response.data.metaobjects.pageInfo.hasNextPage;
		}
	}

	async update(id: string, updates: UpdateConfig<T>) {
		if (Object.keys(updates).length === 0) {
			throw new Error('At least one update must be specified');
		}

		const query = graphql(`
			mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
				metaobjectUpdate(id: $id, metaobject: $metaobject) {
					userErrors {
						field, message
					}
				}
			}`);

		const metaobjectUpdateInput: MetaobjectUpdateInput = {};

		if (updates.capabilities) {
			metaobjectUpdateInput.capabilities = updates.capabilities as InputMaybe<MetaobjectCapabilityDataInput>;
		}
		if (updates.fields?.['_handle']) {
			metaobjectUpdateInput.handle = updates.fields['_handle'];
		}

		for (const [k, v] of Object.entries(updates.fields ?? {})) {
			if (k === '_handle') {
				continue;
			}
			const resultKey = this._.metaobject.fieldKeysMap[k];
			const field = this._.metaobject.fields[k];
			if (!resultKey || !field) {
				throw new Error(`Unknown field "${k}"`);
			}
			if (!metaobjectUpdateInput.fields) {
				metaobjectUpdateInput.fields = [];
			}
			metaobjectUpdateInput.fields.push({
				key: resultKey,
				value: field.toAPIValue(v),
			});
		}

		const response = await this.client(query, {
			id,
			metaobject: metaobjectUpdateInput,
		});

		if (response.errors) {
			throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (response.data?.metaobjectUpdate?.userErrors.length) {
			throw new Error(response.data.metaobjectUpdate.userErrors.map((e) => e.message).join('\n'));
		}
	}

	async insert(item: T['$inferInsert']): Promise<ResultItem<T, undefined>> {
		const query = `
			mutation InsertMetaobject($metaobject: MetaobjectCreateInput!) {
				metaobjectCreate(metaobject: $metaobject) {
					userErrors {
						field, message
					}
					metaobject {
						${this.buildItemSelection({}, Object.keys(this._.metaobject.fieldKeysMap))}
					}
				}
			}`;

		const result = await this.client(query, {
			metaobject: {
				type: this._.metaobject._.config.type,
				fields: Object.entries(item).map(([key, value]) => {
					const field = this._.metaobject.fields[key];
					if (!field) {
						throw new Error(`Unknown field "${key}"`);
					}

					return {
						key: this._.metaobject.fieldKeysMap[key],
						value: field.toAPIValue(value),
					};
				}),
			},
		});

		if (result.errors) {
			throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (result.data?.metaobjectInsert?.userErrors.length) {
			throw new Error(
				result.data.metaobjectInsert.userErrors
					.map((e: Pick<MetaobjectUserError, 'message' | 'field'>) => e.message)
					.join('\n'),
			);
		}

		const allSelectedFieldsMap = this.getSelectedFields(undefined);
		const allSelectedFields = Object.keys(allSelectedFieldsMap);
		const selectedFields = allSelectedFields.filter((f) => !metaFieldNames.includes(f));

		return this.mapItemResult(result.data.metaobjectInsert.metaobject, allSelectedFieldsMap, selectedFields);
	}

	async delete(id: string) {
		const query = graphql(`
			mutation DeleteMetaobject($id: ID!) {
				metaobjectDelete(id: $id) {
					userErrors {
						field, message
					}
				}
			}`);

		const result = await this.client(query, { id });

		if (result.errors) {
			throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (result.data?.metaobjectDelete?.userErrors.length) {
			throw new Error(result.data.metaobjectDelete.userErrors.map((e) => e.message).join('\n'));
		}
	}

	async bulkDelete(ids: string[]) {
		const query = graphql(`
			mutation BulkDeleteMetaobjects($ids: [ID!]!, $type: String!) {
				metaobjectBulkDelete(where: { ids: $ids, type: $type }) {
					userErrors {
						field, message
					}
				}
			}`);

		const result = await this.client(query, {
			ids,
			type: this._.metaobject._.config.type,
		});

		if (result.errors) {
			throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (result.data?.metaobjectBulkDelete?.userErrors.length) {
			throw new Error(result.data.metaobjectBulkDelete.userErrors.map((e) => e.message).join('\n'));
		}
	}
}

export type ShopifyOperationsMap<TSchema extends Record<string, Metaobject<any>>> = {
	[K in keyof TSchema]: ShopifyOperations<TSchema[K]>;
};

export type Shopify<TSchema extends Record<string, Metaobject<any>>> = ShopifyBase<TSchema> &
	ShopifyOperationsMap<TSchema>;

export interface ShopifyConfig<TSchema extends Record<string, unknown>> {
	shop: string;
	headers: Record<string, string>;
	schema: TSchema;
}

export function shopify<TSchema extends Record<string, unknown>>(
	config: ShopifyConfig<TSchema>,
): Shopify<ExtractSchema<TSchema>> {
	const client = createGQLClient(fetch, config.shop, config.headers);

	return Object.assign(
		new ShopifyBase(client, config.schema as ExtractSchema<TSchema>),
		Object.fromEntries(
			Object.entries(config.schema)
				.filter(([, v]) => v instanceof Metaobject)
				.map(([key, metaobject]) => [key, new ShopifyOperations(metaobject as Metaobject<any>, client)]),
		),
	) as Shopify<ExtractSchema<TSchema>>;
}

export function buildListQueryItem(query: ListConfigQueryItem<string | number | boolean | Date>): string {
	if (typeof query === 'string' || typeof query === 'number' || typeof query === 'boolean') {
		return `"${query}"`;
	}
	if (query instanceof Date) {
		return `"${query.toISOString()}"`;
	}
	if (Object.keys(query).length > 1) {
		throw new Error(`Query item must have only one key: ${JSON.stringify(query)}`);
	}
	if ('$raw' in query && query.$raw !== undefined) {
		return query.$raw;
	}
	if ('$not' in query && query.$not !== undefined) {
		return `NOT ${buildListQueryItem(query.$not)}`;
	}
	if ('$lt' in query && query.$lt !== undefined) {
		return `<${buildListQueryItem(query.$lt)}`;
	}
	if ('$lte' in query && query.$lte !== undefined) {
		return `<=${buildListQueryItem(query.$lte)}`;
	}
	if ('$gt' in query && query.$gt !== undefined) {
		return `>${buildListQueryItem(query.$gt)}`;
	}
	if ('$gte' in query && query.$gte !== undefined) {
		return `>=${buildListQueryItem(query.$gte)}`;
	}
	throw new Error(`Invalid query item: ${JSON.stringify(query)}`);
}

export function buildListQuery(query: ListConfigQuery | undefined): string | undefined {
	if (query === undefined) {
		return undefined;
	}
	if (typeof query === 'string' || typeof query === 'number' || typeof query === 'boolean') {
		return `"${query}"`;
	}
	if (query instanceof Date) {
		return `"${query.toISOString()}"`;
	}
	if (Array.isArray(query)) {
		return `(${query.map(buildListQuery).join(' AND ')})`;
	}
	if ('$raw' in query) {
		if (Object.keys(query).length > 1) {
			throw new Error(`$raw must be the only key in the query: ${JSON.stringify(query)}`);
		}
		return query.$raw;
	}
	if ('$or' in query) {
		if (Object.keys(query).length > 1) {
			throw new Error(`$or must be the only key in the query: ${JSON.stringify(query)}`);
		}
		return `(${query.$or.map(buildListQuery).join(' OR ')})`;
	}
	const parts: string[] = [];
	if ('displayName' in query && query.displayName !== undefined) {
		parts.push(`display_name:${buildListQueryItem(query.displayName)}`);
	}
	if ('updatedAt' in query && query.updatedAt !== undefined) {
		parts.push(`updated_at:${buildListQueryItem(query.updatedAt)}`);
	}
	return parts.join(' AND ');
}
