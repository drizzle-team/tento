import { graphql } from '../graphql/gen';
import {
	MetafieldOwnerType,
	MetaobjectDefinitionUpdateInput,
	MetaobjectFieldDefinitionUpdateInput,
	MutationMetaobjectDefinitionCreateArgs,
	MutationMetaobjectDefinitionUpdateArgs,
} from '../graphql/gen/graphql';
import { Client } from './gql-client';
import {
	MetafieldDefinition,
	MetafieldDefinitionUpdateInput,
	MutationMetafieldDefinitionCreateArgs,
	MutationMetafieldDefinitionUpdateArgs,
} from './metafield/types';
import { MetaobjectDefinition, MetaobjectFieldDefinition } from './metaobject/types';
import { MetafieldDefinitionValidationInput } from './types';

export async function introspectMetaobjectRemoteSchema(client: Client) {
	const introspectionQuery = graphql(`
		query Introspection {
			metaobjectDefinitions(first: 100) {
				nodes {
					id
					name
					description
					type
					fieldDefinitions {
						name
						required
						description
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
	`);

	const introspectionResult = await client(introspectionQuery);
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
	});

	return introspectedMetaobjectsList;
}

export type MetaobjectIntrospection = ReturnType<typeof introspectMetaobjectRemoteSchema> extends Promise<infer T>
	? T
	: never;

// TODO() Do we need to compare not only field definitions ???
export function diffSchemas({
	local,
	remote,
}: {
	local: Record<string, MetaobjectDefinition>;
	remote: MetaobjectIntrospection;
}): {
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
			result.create.push({
				definition: {
					...localDef,
				},
			});
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

/**
 * Difference only between fieldDefinitions()
 *
 * @param local
 * @param remote
 * @returns
 */
export function diffMetaobjectDefinitions(
	local: MetaobjectDefinition,
	remote: MetaobjectIntrospection[number],
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
	remoteField: MetaobjectIntrospection[number]['fieldDefinitions'][number],
): MetaobjectFieldDefinitionUpdateInput | undefined {
	const updates: Omit<MetaobjectFieldDefinitionUpdateInput, 'key'> = {};
	if ((localField.description ?? '') !== (remoteField.description ?? '')) {
		updates.description = localField.description ?? '';
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

/**
 * For now allows only to introspect @PRODUCT ownerType
 *
 * @param client GQL Shopify Client
 * @returns Introspected Metafield list
 */
export interface IMetafieldDefition {
	id: string;
	name: string;
	key: string;
	namespace: string;
	description: string;
	pin: boolean;
	ownerType: `${MetafieldOwnerType}`;
	useAsCollectionCondition: boolean;
	fieldDefinition: {
		type: string;
		validations: { name: string; value: string | null }[];
	};
}
// TOOD() No need to get metaobject type for reference on push/ applySchema(), only on pull
export async function introspectMetafieldRemoteSchema(client: Client) {
	const introspectionQuery = `
		query Introspection($query: String) {
			metafieldDefinitions(first: 100, ownerType: PRODUCT, query: $query) {
				nodes {
					id
                    name
                    key
                    namespace
					ownerType
                    description
                    type { name }
                    useAsCollectionCondition
                    validationStatus
                    pinnedPosition
                    validations {
                        name
                        value
                    }
				}
			}
		}
	`;
	/**
	 * Get all metafields with namespace starts with prefix
	 */
	const introspectionResult = await client(introspectionQuery);
	if (introspectionResult.errors?.graphQLErrors?.length) {
		throw new Error(introspectionResult.errors.graphQLErrors[0].message);
	}

	const referencedMetaobjects: {
		id: string;
		metaobjectId: string;
	}[] = [];
	const introspectedMetaobjectsList: IMetafieldDefition[] = introspectionResult.data!.metafieldDefinitions.nodes.map(
		(node: any) => {
			const metaConf: IMetafieldDefition = {
				id: node.id,
				name: node.name,
				key: node.key,
				namespace: node.namespace,
				description: node.description,
				pin: typeof node.pinnedPosition === 'number',
				ownerType: node.ownerType satisfies `${MetafieldOwnerType}`, // check it
				useAsCollectionCondition: node.useAsCollectionCondition,
				fieldDefinition: {
					type: node.type.name,
					validations: node.validations,
				},
			};

			// TODO() change it
			if (metaConf.fieldDefinition.type === 'metaobject_reference') {
				referencedMetaobjects.push(
					...metaConf.fieldDefinition.validations.map((val) => {
						return { id: metaConf.id, metaobjectId: val.value! };
					}),
				);
			}

			return metaConf;
		},
	);

	if (referencedMetaobjects.length) {
		const query = `
			query GetMetaobjectDefinitionById($id: ID!) {
				metaobjectDefinition(id: $id) {
					type
				}
			}
		`;

		for (const referencedMeta of referencedMetaobjects) {
			const result = await client(query, { id: referencedMeta.metaobjectId });
			if (result.errors?.graphQLErrors?.length) {
				throw new Error(result.errors.graphQLErrors[0].message);
			}

			const metafield = introspectedMetaobjectsList.find((introMeta) => introMeta.id === referencedMeta.id)!;
			const validation = metafield.fieldDefinition.validations.find(
				(val) => val.value === referencedMeta.metaobjectId,
			)!;

			validation.value = result.data.metaobjectDefinition.type;
		}
	}

	return introspectedMetaobjectsList;
}

export type MetafieldIntrospection = ReturnType<typeof introspectMetafieldRemoteSchema> extends Promise<infer T>
	? T
	: never;

export async function setMetaobjectIdFor({
	client,
	validations,
}: {
	client: Client;
	validations: MetafieldDefinitionValidationInput[];
}): Promise<void> {
	for (const validation of validations) {
		const getMetaobjectId = `
			query GetMetaobjectDefinitionByType($type: String!) {
				metaobjectDefinitionByType(type: $type) {
					id
				}
			}
		`;

		const result = await client(getMetaobjectId, { type: validation.value });
		if (result.errors?.graphQLErrors?.length) {
			throw new Error(result.errors.graphQLErrors[0].message);
		}

		validation.value = result.data.metaobjectDefinitionByType.id;
	}
}

export function diffMetafieldSchemas({
	local,
	remote,
}: {
	local: Record<string, MetafieldDefinition>;
	remote: MetafieldIntrospection;
}): {
	create: MutationMetafieldDefinitionCreateArgs[];
	update: MutationMetafieldDefinitionUpdateArgs[];
	delete: string[];
} {
	const localDefs = Object.values(local);
	const result: {
		create: MutationMetafieldDefinitionCreateArgs[];
		update: MutationMetafieldDefinitionUpdateArgs[];
		delete: string[];
	} = {
		create: [],
		update: [],
		delete: [],
	};

	for (const localDef of localDefs) {
		const remoteDef = remote.find(
			(metafield) =>
				// TODO() check it, shopify usually add 'custom' as namespace if not specified
				`${metafield.namespace}.${metafield.key}` ===
				`${localDef.namespace ? `${localDef.namespace}` : 'custom'}.${localDef.key}`,
		);
		if (!remoteDef) {
			result.create.push({
				definition: {
					type: localDef.fieldDefinition.type,
					access: localDef.access,
					key: localDef.key!,
					ownerType: localDef.ownerType,
					description: localDef.description,
					name: localDef.name,
					namespace: localDef.namespace ? localDef.namespace : 'custom',
					pin: localDef.pin,
					useAsCollectionCondition: localDef.useAsCollectionCondition,
					validations: localDef.fieldDefinition.validations,
				},
			});
		} else {
			const diff = diffMetafieldDefinitions({ localField: localDef, remoteField: remoteDef });
			if (diff) {
				result.update.push({ definition: diff, id: diff.id! });
			}
		}
	}

	for (const introspectedMetafield of remote) {
		const schemaMetaobject = localDefs.find(
			(value) =>
				`${value.namespace ? `${value.namespace}` : 'custom'}.${value.key}` ===
				`${introspectedMetafield.namespace}.${introspectedMetafield.key}`,
		);
		if (!schemaMetaobject) {
			result.delete.push(introspectedMetafield.id);
		}
	}

	return result;
}

type PartialMetafieldDefinitionUpdateInput = Partial<MetafieldDefinitionUpdateInput>;
export function diffMetafieldDefinitions({
	localField,
	remoteField,
}: {
	localField: MetafieldDefinition;
	remoteField: MetafieldIntrospection[number];
}): MetafieldDefinitionUpdateInput | undefined {
	const partialUpdateInput: PartialMetafieldDefinitionUpdateInput = {};

	if (localField.key !== remoteField.key) {
		partialUpdateInput.key = localField.key;
	}

	if (localField.ownerType !== remoteField.ownerType) {
		partialUpdateInput.ownerType = localField.ownerType;
	}

	if ((localField.description ?? '') !== (remoteField.description ?? '')) {
		partialUpdateInput.description = localField.description;
	}

	const localName = localField.name ?? localField.key;
	if (localName !== remoteField.name) {
		partialUpdateInput.name = localField.name;
	}

	const localPin = localField.pin ?? false;
	if (localPin !== remoteField.pin) {
		partialUpdateInput.pin = localPin;
	}

	const localNamespace = localField.namespace ? localField.namespace : 'custom';
	if (localNamespace !== remoteField.namespace) {
		partialUpdateInput.namespace = localField.namespace;
	}

	// access left

	const localUseAsCollectionCondition = localField.useAsCollectionCondition ?? false;
	if (localUseAsCollectionCondition !== remoteField.useAsCollectionCondition) {
		partialUpdateInput.useAsCollectionCondition = localUseAsCollectionCondition;
	}

	// TODO() If validiation exists + name is metaobject_definition_id -> map to ${prefix}_${value}
	const sortedLocalValidations =
		localField.fieldDefinition.validations?.sort((a, b) => a.name.localeCompare(b.name)) ?? [];
	const sortedRemoteValidations = remoteField.fieldDefinition.validations?.sort((a, b) => a.name.localeCompare(b.name));

	if (
		sortedLocalValidations !== undefined &&
		(sortedRemoteValidations === undefined ||
			JSON.stringify(sortedLocalValidations) !== JSON.stringify(sortedRemoteValidations))
	) {
		partialUpdateInput.validations = sortedLocalValidations;
	}

	if (Object.keys(partialUpdateInput).length > 0) {
		const updates: MetafieldDefinitionUpdateInput = {
			id: remoteField.id,
			key: partialUpdateInput.key ?? localField.key!,
			ownerType: partialUpdateInput.ownerType ?? localField.ownerType,
			namespace: partialUpdateInput.namespace ?? localField.namespace,
			...partialUpdateInput,
		};

		return updates;
	}
	return undefined;
}
