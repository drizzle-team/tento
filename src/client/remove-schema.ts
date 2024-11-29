import {
	MetafieldIntrospection,
	MetaobjectIntrospection,
	introspectMetafieldRemoteSchema,
	introspectMetaobjectRemoteSchema,
} from './diff';
import { Client } from './gql-client';
import { Metaobject } from './metaobject/metaobject';
import { Metafield } from './metafield';
import { deleteMetafieldQuery, deleteMetaobjectQuery } from './apply-schema';

export async function removeSchema({
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

	const diffMetaobjects: string[] = remoteMetaobjectSchema.map((remoteMetaobject) => remoteMetaobject.id);
	const diffMetafields: string[] = remoteMetafieldSchema.map((remoteMetafield) => remoteMetafield.id);

	if (!diffMetaobjects.length && !diffMetafields.length) {
		return;
	}

	// Metaobject
	for (const id of diffMetaobjects) {
		const result = await client(deleteMetaobjectQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metaobjectDefinitionDelete?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metaobjectDefinitionDelete.userErrors));
		}
	}

	// Metafield
	for (const id of diffMetafields) {
		const result = await client(deleteMetafieldQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(JSON.stringify(result.errors.graphQLErrors));
		}
		if (result.data?.metafieldDefinitionDelete?.userErrors?.length) {
			throw new Error(JSON.stringify(result.data.metafieldDefinitionDelete.userErrors));
		}
	}
}
