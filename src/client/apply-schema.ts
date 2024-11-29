import {
	MetafieldIntrospection,
	MetaobjectIntrospection,
	diffMetafieldSchemas,
	diffSchemas,
	introspectMetafieldRemoteSchema,
	introspectMetaobjectRemoteSchema,
	setMetaobjectIdFor,
} from './diff';
import { Client } from './gql-client';
import { graphql } from '../graphql/gen';
import { Metaobject } from './metaobject/metaobject';
import { Metafield } from './metafield';

export async function applySchema({
	localSchema: rawLocalSchema,
	remoteMetaobjectSchema,
	remoteMetafieldSchema,
	client,
	unknownEntities,
}: {
	localSchema: Record<string, any>;
	remoteMetaobjectSchema?: MetaobjectIntrospection;
	remoteMetafieldSchema?: MetafieldIntrospection;
	client: Client;
	unknownEntities: 'delete' | 'ignore';
}) {
	remoteMetaobjectSchema ??= await introspectMetaobjectRemoteSchema(client);
	remoteMetafieldSchema ??= await introspectMetafieldRemoteSchema(client);

	const localMetaobjectSchema = Object.fromEntries(
		Object.entries(rawLocalSchema)
			.filter((e): e is [(typeof e)[0], Metaobject<any>] => e[1] instanceof Metaobject)
			.map(([key, value]) => [key, value._.config]),
	);
	const localMetafieldSchema = Object.fromEntries(
		Object.entries(rawLocalSchema)
			.filter((e): e is [(typeof e)[0], Metafield] => e[1] instanceof Metafield)
			.map(([key, value]) => [key, value._.config]),
	);

	/**
	 * When config option is 'ignore' we need to work only with local metaobjects, metafields.
	 * It also ensures that only local specified metaobjects and metafields are retained, preventing the deletion of other existing items.
	 */
	if (unknownEntities === 'ignore') {
		const localMetaobjectTypes = Object.values(localMetaobjectSchema).map((localMetaobject) => localMetaobject.type);
		const localMetafieldTypes = Object.values(localMetafieldSchema).map(
			(localMetaobject) =>
				`${localMetaobject.namespace ? `${localMetaobject.namespace}` : 'custom'}.${localMetaobject.key}`,
		);

		remoteMetaobjectSchema = remoteMetaobjectSchema
			.filter((metaobject) => {
				return localMetaobjectTypes.includes(metaobject.type);
			})
			.filter(Boolean);
		remoteMetafieldSchema = remoteMetafieldSchema
			.filter((metafield) => {
				return localMetafieldTypes.includes(`${metafield.namespace}.${metafield.key}`);
			})
			.filter(Boolean);
	}

	console.log(Object.entries(rawLocalSchema));
	console.log(JSON.stringify({ localSchema: localMetaobjectSchema }, null, 2));
	console.log(JSON.stringify({ remoteMetaobjectSchema }, null, 2));
	console.log(JSON.stringify({ localSchema: localMetafieldSchema }, null, 2));
	console.log(JSON.stringify({ remoteMetafieldSchema }, null, 2));
	const diffMetaobjects = diffSchemas({
		local: localMetaobjectSchema,
		remote: remoteMetaobjectSchema,
	});
	const diffMetafields = diffMetafieldSchemas({
		local: localMetafieldSchema,
		remote: remoteMetafieldSchema,
	});

	console.log(JSON.stringify(diffMetaobjects, null, 2));
	console.log(JSON.stringify(diffMetafields, null, 2));

	if (
		!diffMetaobjects.create.length &&
		!diffMetaobjects.update.length &&
		!diffMetaobjects.delete.length &&
		!diffMetafields.create.length &&
		!diffMetafields.update.length &&
		!diffMetafields.delete.length
	) {
		return;
	}

	// Metaobject
	for (const create of diffMetaobjects.create) {
		const result = await client(createMetaobjectQuery, { definition: create.definition });
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metaobjectDefinitionCreate?.userErrors?.length) {
			console.error(result.data.metaobjectDefinitionCreate.userErrors);
			process.exit(1);
		}
	}

	for (const update of diffMetaobjects.update) {
		const result = await client(updateMetaobjectQuery, {
			id: update.id,
			definition: update.definition,
		});
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metaobjectDefinitionUpdate?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metaobjectDefinitionUpdate.userErrors));
		}
	}

	for (const id of diffMetaobjects.delete) {
		const result = await client(deleteMetaobjectQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metaobjectDefinitionDelete?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metaobjectDefinitionDelete.userErrors));
		}
	}

	// Metafield
	for (const create of diffMetafields.create) {
		const referenceValidations = create.definition.validations?.filter((v) => v.name === 'metaobject_definition_id');
		if (typeof referenceValidations !== 'undefined') {
			await setMetaobjectIdFor({ client, validations: referenceValidations });
		}

		const result = await client(createMetafieldQuery, { definition: create.definition });
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metafieldDefinitionCreate?.userErrors?.length) {
			console.error(result.data.metafieldDefinitionCreate.userErrors);
			process.exit(1);
		}
	}

	for (const update of diffMetafields.update) {
		const referenceValidations = update.definition.validations?.filter((v) => v.name === 'metaobject_definition_id');
		if (typeof referenceValidations !== 'undefined') {
			await setMetaobjectIdFor({ client, validations: referenceValidations });
		}

		const { definition } = update;
		const result = await client(updateMetafieldQuery, {
			definition: {
				description: definition.description ?? undefined,
				key: definition.key,
				ownerType: definition.ownerType,
				name: definition.name ?? undefined,
				namespace: definition.namespace ?? undefined,
				pin: typeof definition.pin !== 'undefined' ? definition.pin : undefined,
				useAsCollectionCondition:
					typeof definition.useAsCollectionCondition !== 'undefined' ? definition.useAsCollectionCondition : undefined,
				validations: definition.validations ?? undefined,
			},
		});
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metafieldDefinitionUpdate?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metafieldDefinitionUpdate.userErrors));
		}
	}

	for (const id of diffMetafields.delete) {
		const result = await client(deleteMetafieldQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metafieldDefinitionDelete?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metafieldDefinitionDelete.userErrors));
		}
	}
}

// Metaobject
const createMetaobjectQuery = graphql(`
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        name
      }
      userErrors {
        field, message
      }
    }
  }
`);

const updateMetaobjectQuery = graphql(`
  mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        name
      }
      userErrors {
        field, message
      }
    }
  }
`);

export const deleteMetaobjectQuery = graphql(`
  mutation DeleteMetaobjectDefinition($id: ID!) {
    metaobjectDefinitionDelete(id: $id) {
      userErrors {
        field, message
      }
    }
  }
`);

// Metafield
const createMetafieldQuery = `
	mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
		metafieldDefinitionCreate(definition: $definition) {
			createdDefinition {
				namespace
				key
			}
			userErrors {
				field, message
			}
		}
	}
`;

const updateMetafieldQuery = `
	mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
		metafieldDefinitionUpdate(definition: $definition) {
			updatedDefinition {
				namespace
				key
			}
			userErrors {
				field, message
			}
		}
	}
`;

export const deleteMetafieldQuery = `
	mutation DeleteMetafieldDefinition($id: ID!) {
		metafieldDefinitionDelete(id: $id) {
			userErrors {
				field, message
			}
		}
	}
`;
