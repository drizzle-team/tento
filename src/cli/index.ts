import path from 'node:path';
import { object, record, string, type Input } from 'valibot';

import { Metaobject, type MetaobjectDefinition, type MetaobjectFieldDefinition } from '@drizzle-team/shopify';
import type { IntrospectionQuery } from 'src/graphql/gen/types/admin.generated.js';
import type {
	MetaobjectDefinitionUpdateInput,
	MetaobjectFieldDefinitionUpdateInput,
	MutationMetaobjectDefinitionCreateArgs,
	MutationMetaobjectDefinitionUpdateArgs,
} from 'src/graphql/gen/types/admin.types.js';

export async function readLocalSchema(schemaPath: string) {
	const importResult = require(path.resolve(schemaPath));
	const schema: Record<string, MetaobjectDefinition> = {};
	for (const key in importResult) {
		const value = importResult[key];
		if (value instanceof Metaobject) {
			schema[key] = value._.config;
		}
	}

	return schema;
}

export type Fetch = typeof fetch;

export interface ResponseErrors {
	networkStatusCode?: number;
	message?: string;
	graphQLErrors?: any[];
}

export interface ClientResponse<TData> {
	data?: TData;
	errors?: ResponseErrors;
}

export interface GQLClient {
	<TResult = unknown, TVars = Record<string, unknown>>(query: string, vars?: TVars): Promise<ClientResponse<TResult>>;
}

export function createGQLClient(fetch: Fetch, url: string, headers: Record<string, string>) {
	const client: GQLClient = async (query, vars) => {
		const response = await fetch(url, {
			method: 'POST',
			headers,
			body: JSON.stringify({ query, variables: vars }),
		});
		const result = await response.json();
		if (result.errors) {
			throw new Error(result.errors[0].message);
		}
		return result;
	};
	return client;
}

export async function introspectRemoteSchema(client: GQLClient) {
	const introspectionQuery = `#graphql
		query Introspection {
			metaobjectDefinitions(first: 100) {
				nodes {
					id
					name
					type
					fieldDefinitions {
						name
						required
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

	const introspectionResult = await client<IntrospectionQuery>(introspectionQuery);
	if (introspectionResult.errors?.graphQLErrors?.length) {
		throw new Error(introspectionResult.errors.graphQLErrors[0].message);
	}
	const introspectedMetaobjectsList = introspectionResult.data!.metaobjectDefinitions.nodes.map((node) => {
		return {
			...node,
			fieldDefinitions: node.fieldDefinitions.map((field) => {
				return {
					...field,
					type: field.type.name,
				};
			}),
		};
	}) as (MetaobjectDefinition & { id: string })[];

	return introspectedMetaobjectsList;
}

export function diffSchemas(
	local: Record<string, MetaobjectDefinition>,
	remote: (MetaobjectDefinition & { id: string })[],
): {
	create: MutationMetaobjectDefinitionCreateArgs[];
	update: MutationMetaobjectDefinitionUpdateArgs[];
	delete: string[];
} {
	const localDefs = Object.values(local);
	const result: {
		create: MutationMetaobjectDefinitionCreateArgs[];
		update: MutationMetaobjectDefinitionUpdateArgs[];
		delete: string[];
	} = {
		create: [],
		update: [],
		delete: [],
	};

	for (const localDef of localDefs) {
		const remoteDef = remote.find((metaobject) => metaobject.type === localDef.type);
		if (!remoteDef) {
			result.create.push({ definition: localDef });
		} else {
			const diff = diffMetaobjectDefinitions(localDef, remoteDef);
			if (diff) {
				result.update.push({ id: remoteDef.id, definition: diff });
			}
		}
	}

	for (const introspectedMetaobject of remote) {
		const schemaMetaobject = localDefs.find((value) => value.type === introspectedMetaobject.type);
		if (!schemaMetaobject) {
			result.delete.push(introspectedMetaobject.id);
		}
	}

	return result;
}

export function diffMetaobjectDefinitions(
	local: MetaobjectDefinition,
	remote: MetaobjectDefinition & { id: string },
): MetaobjectDefinitionUpdateInput | undefined {
	const localFields = Object.values(local.fieldDefinitions);
	const remoteFields = Object.values(remote.fieldDefinitions);
	const result: MetaobjectDefinitionUpdateInput = {
		fieldDefinitions: [],
	};
	if (local.name !== remote.name) {
		result.name = local.name ?? null;
	}

	for (const localField of localFields) {
		const remoteField = remoteFields.find((f) => f.key === localField.key);
		if (!remoteField) {
			result.fieldDefinitions!.push({ create: localField });
		} else {
			const diff = diffFields(localField, remoteField);
			if (diff) {
				result.fieldDefinitions!.push({ update: diff });
			}
		}
	}

	for (const remoteField of remoteFields) {
		const schemaField = localFields.find((f) => f.key === remoteField.key);
		if (!schemaField) {
			result.fieldDefinitions!.push({ delete: { key: remoteField.key } });
		}
	}

	if (result.fieldDefinitions!.length === 0) {
		delete result.fieldDefinitions;
	}

	if (Object.keys(result).length === 0) {
		return undefined;
	}

	return result;
}

export function diffFields(
	localField: MetaobjectFieldDefinition,
	remoteField: MetaobjectFieldDefinition,
): MetaobjectFieldDefinitionUpdateInput | undefined {
	const updates: Omit<MetaobjectFieldDefinitionUpdateInput, 'key'> = {};
	const localDescription = localField.description ?? '';
	if (localDescription !== remoteField.description) {
		updates.description = localDescription;
	}
	const localName = localField.name ?? localField.key;
	if (localName !== remoteField.name) {
		updates.name = localName;
	}

	const localRequired = localField.required ?? false;
	if (localRequired !== remoteField.required) {
		updates.required = localRequired;
	}

	const sortedLocalValidations = localField.validations?.sort((a, b) => a.name.localeCompare(b.name));
	const sortedRemoteValidations = remoteField.validations?.sort((a, b) => a.name.localeCompare(b.name));

	if (
		sortedLocalValidations !== undefined &&
		(sortedRemoteValidations === undefined ||
			JSON.stringify(sortedLocalValidations) !== JSON.stringify(sortedRemoteValidations))
	) {
		updates.validations = sortedLocalValidations;
	}

	return Object.keys(updates).length > 0
		? {
				key: localField.key,
				...updates,
		  }
		: undefined;
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
