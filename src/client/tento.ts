import { applySchema } from './apply-schema';
import { Metaobject } from './metaobject';
import { ShopifyMetaobjectOperations } from './metaobject/query';
import { type Client, ClientSource, createClientFromSource } from './gql-client';
import { ExtractMetafieldSchema, ExtractMetaobjectSchema } from './types';
import { ShopifyProductOperations } from './product/query';
import { Metafield } from './metafield';
import { removeSchema } from './remove-schema';
import { ShopifyJobOperations } from './common/query';

export class Tento<
	TMetaobjectSchema extends Record<string, Metaobject<any>>,
	TMetafieldSchema extends Record<string, Metafield>,
> {
	readonly _: {
		readonly client: Client;
		readonly schema: Record<string, Metaobject<any> | Metafield>;
	};

	metaobjects: TentoMetaobjectOperationsMap<TMetaobjectSchema>;
	products: ShopifyProductOperations<TMetafieldSchema>;
	jobs: ShopifyJobOperations;

	constructor(client: Client, metaobjectSchema: TMetaobjectSchema, metafieldSchema: TMetafieldSchema) {
		this._ = { client, schema: { ...metaobjectSchema, ...metafieldSchema } };

		this.metaobjects = Object.fromEntries(
			Object.entries(metaobjectSchema).map(([key, metaobject]) => [
				key,
				new ShopifyMetaobjectOperations(metaobject, client),
			]),
		) as TentoMetaobjectOperationsMap<TMetaobjectSchema>;
		this.products = new ShopifyProductOperations(client, metafieldSchema);
		this.jobs = new ShopifyJobOperations(client);
	}

	async applySchema(config?: {
		unknownEntities: 'delete' | 'ignore';
	}) {
		await applySchema({
			localSchema: this._.schema,
			client: this._.client,
			unknownEntities: config?.unknownEntities ?? 'ignore',
		});
	}

	async removeSchema(config?: {
		unknownEntities: 'delete' | 'ignore';
	}) {
		await removeSchema({
			localSchema: this._.schema,
			client: this._.client,
			unknownEntities: config?.unknownEntities ?? 'ignore',
		});
	}
}

export type TentoMetaobjectOperationsMap<TSchema extends Record<string, Metaobject<any>>> = {
	[K in keyof TSchema]: ShopifyMetaobjectOperations<TSchema[K]>;
};

export interface TentoConfig<TSchema extends Record<string, unknown>> {
	client: ClientSource;
	schema: TSchema;
}

export function tento<TSchema extends Record<string, unknown>>(
	config: TentoConfig<TSchema>,
): Tento<ExtractMetaobjectSchema<TSchema>, ExtractMetafieldSchema<TSchema>> {
	const { client: clientSource, schema: rawSchema } = config;
	const client = createClientFromSource(clientSource);
	const metaobjectSchema = Object.fromEntries(
		Object.entries(rawSchema).filter((e): e is [(typeof e)[0], Metaobject<any>] => {
			return e[1] instanceof Metaobject;
		}),
	) as ExtractMetaobjectSchema<TSchema>;

	const metafieldSchema = Object.fromEntries(
		Object.entries(rawSchema).filter((e): e is [(typeof e)[0], Metafield] => {
			return e[1] instanceof Metafield;
		}),
	) as ExtractMetafieldSchema<TSchema>;

	return new Tento(client, metaobjectSchema, metafieldSchema);
}
