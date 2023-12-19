import { Metaobject } from './metaobject';
import { Introspection, diffSchemas, introspectRemoteSchema } from './diff';
import { Client } from './gql-client';
import { graphql } from '../graphql/gen';

export async function applySchema({
	localSchema: rawLocalSchema,
	remoteSchema,
	client,
}: {
	localSchema: Record<string, any>;
	remoteSchema?: Introspection;
	client: Client;
}) {
	remoteSchema ??= await introspectRemoteSchema(client);
	const localSchema = Object.fromEntries(
		Object.entries(rawLocalSchema)
			.filter((e): e is [(typeof e)[0], Metaobject<any>] => e[1] instanceof Metaobject)
			.map(([key, value]) => [key, value._.config]),
	);
	console.log(Object.entries(rawLocalSchema));
	console.log(JSON.stringify({ localSchema }, null, 2));
	console.log(JSON.stringify({ remoteSchema }, null, 2));
	const diff = diffSchemas(localSchema, remoteSchema);

	console.log(JSON.stringify(diff, null, 2));

	if (!diff.create.length && !diff.update.length && !diff.delete.length) {
		return;
	}

	for (const create of diff.create) {
		const result = await client(createQuery, { definition: create.definition });
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metaobjectDefinitionCreate?.userErrors?.length) {
			console.error(result.data.metaobjectDefinitionCreate.userErrors);
			process.exit(1);
		}
	}

	for (const update of diff.update) {
		const result = await client(updateQuery, {
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

	for (const id of diff.delete) {
		const result = await client(deleteQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metaobjectDefinitionDelete?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metaobjectDefinitionDelete.userErrors));
		}
	}
}

const createQuery = graphql(`
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

const updateQuery = graphql(`
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

const deleteQuery = graphql(`
  mutation DeleteMetaobjectDefinition($id: ID!) {
    metaobjectDefinitionDelete(id: $id) {
      userErrors {
        field, message
      }
    }
  }
`);
