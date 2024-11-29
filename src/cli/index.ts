import path from 'node:path';
import { object, record, string, type InferInput } from 'valibot';
import { MetafieldDefinition } from '../client/metafield/types';
import { Metafield } from '../client/metafield/metafield';
import { Metaobject, MetaobjectDefinition } from '../client/metaobject';

export async function readLocalSchema(schemaPath: string): Promise<{
	metaobjectSchema: Record<string, MetaobjectDefinition>;
	metafieldSchema: Record<string, MetafieldDefinition>;
}> {
	const importResult = await import(path.resolve(schemaPath));
	const metaobjectSchema: Record<string, MetaobjectDefinition> = {};
	const metafieldSchema: Record<string, MetafieldDefinition> = {};
	for (const key in importResult) {
		const value = importResult[key];
		if (value instanceof Metaobject) {
			metaobjectSchema[key] = value._.config;
		} else if (value instanceof Metafield) {
			metafieldSchema[key] = value._.config;
		}
	}

	return {
		metaobjectSchema,
		metafieldSchema,
	};
}

export const configSchema = object({
	schemaPath: string(),
	shop: string(),
	headers: record(string(), string()),
});

export type Config = InferInput<typeof configSchema>;

export function defineConfig(config: Config) {
	return config;
}
