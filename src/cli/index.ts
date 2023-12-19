import path from 'node:path';
import { object, record, string, type Input } from 'valibot';
import { Metaobject, type MetaobjectDefinition } from '@drizzle-team/tento';

export async function readLocalSchema(schemaPath: string) {
	const importResult = await import(path.resolve(schemaPath));
	const schema: Record<string, MetaobjectDefinition> = {};
	for (const key in importResult) {
		const value = importResult[key];
		if (value instanceof Metaobject) {
			schema[key] = value._.config;
		}
	}

	return schema;
}

export const configSchema = object({
	schemaPath: string(),
	shop: string(),
	headers: record(string(), string()),
});

export type Config = Input<typeof configSchema>;

export function defineConfig(config: Config) {
	return config;
}
