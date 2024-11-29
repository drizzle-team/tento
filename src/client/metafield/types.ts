import { MetafieldAccessGrant, MetafieldAdminAccess } from '../../graphql/gen/graphql';
import { MetafieldDefinitionValidationInput, MetafieldOwnerType, Simplify } from '../types';
import { Field, Fields } from './field';

export type InferSelectModel<TBase> = Simplify<TBase>;

export enum MetafieldStorefrontAccess {
	/**
	 * Metafields are not accessible in any Storefront API surface area.
	 *
	 */
	None = 'NONE',
	/**
	 * Metafields are accessible in the GraphQL Storefront API and online store Liquid templates.
	 *
	 */
	PublicRead = 'PUBLIC_READ',
}

export enum MetafieldCustomerAccountAccess {
	/**
	 * The Customer Account API cannot access metafields.
	 *
	 */
	None = 'NONE',
	/**
	 * The Customer Account API can read metafields.
	 *
	 */
	Read = 'READ',
	/**
	 * The Customer Account API can read and write metafields.
	 *
	 */
	ReadWrite = 'READ_WRITE',
}

/** Possible admin access settings for metafields. */
export enum MetafieldAdminAccess1 {
	/** Owner gets full access. The merchant has read-only access. No one else has access rights. */
	MerchantRead = 'MERCHANT_READ',
	/** Owner gets full access. The merchant has read and write access. No one else has access rights. */
	MerchantReadWrite = 'MERCHANT_READ_WRITE',
	/** Owner gets full access. No one else has access rights. */
	Private = 'PRIVATE',
	/** Owner gets full access. All applications and the merchant have read-only access. */
	PublicRead = 'PUBLIC_READ',
	/** Owner gets full access. All applications and the merchant have read and write access. */
	PublicReadWrite = 'PUBLIC_READ_WRITE',
}

/** The input fields for configuring metaobject access controls. */
export type MetafieldAccessInput = {
	/**
	 * Access configuration for Admin API surface areas, including the GraphQL Admin API.
	 *
	 */
	admin: MetafieldAdminAccess;
	/**
	 * Access configuration for Storefront API surface areas, including the GraphQL Storefront API and Liquid.
	 *
	 */
	storefront?: MetafieldStorefrontAccess;
	/**
	 * The explicit grants for this metafield definition, superseding the default admin access for the specified grantees.
	 *
	 */
	grants: MetafieldAccessGrant[];
	/**
	 * The possible values for setting metafield Customer Account API access.
	 *
	 */
	customerAccount?: MetafieldCustomerAccountAccess;
};

/** The input fields for creating a metaobject definition. */
export type MetafieldDefinition = Omit<MetafieldDefinitionConfig, 'fieldDefinition'> & {
	/** A set of field definitions to create on this metaobject definition. */
	fieldDefinition: MetafieldFieldDefinition;
};

/** The input fields for creating a metafield field definition. */
export type MetafieldFieldDefinition = Omit<MetafieldFieldDefinitionConfig<any>, 'validations' | 'key'> & {
	/**
	 * The key of the new field definition. This can't be changed.
	 *
	 * Must be 3-64 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	key: string;
	/** The metafield type applied to values of the field. */
	type: string;
	/** Custom validations that apply to values assigned to the field. */
	validations: MetafieldDefinitionValidationInput[] | undefined;
};

/** The input fields for creating a metafield field definition. */
export interface MetafieldFieldDefinitionConfig<
	TValidators extends Record<string, (...args: any[]) => MetafieldDefinitionValidationInput> = Record<string, never>,
> {
	/** Custom validations that apply to values assigned to the field. */
	validations?: (validators: TValidators) => MetafieldDefinitionValidationInput[];
}

export type MetafieldFieldDefinitionBuilder = Omit<MetafieldFieldDefinition, 'key'> &
	Partial<Pick<MetafieldFieldDefinition, 'key'>>;

/** The input fields for creating a metaobject definition. */
export type MetafieldDefinitionConfig<TName extends string = string> = {
	/** Access configuration for the metafields created with this definition. */
	access?: MetafieldAccessInput;
	/** An administrative description of the definition. */
	description?: string;
	/**
	 * The human-readable name for the metafield definition.
	 *
	 */
	name: TName;
	/**
	 * The key of the new field definition. This can't be changed.
	 *
	 * Must be 3-64 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	key?: string;
	/**
	 * The container for a group of metafields that the metafield definition will be associated with. If omitted, the app-reserved namespace will be used.
	 *
	 * Must be 3-255 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 */
	namespace?: string;
	/**
	 * The resource type that the metafield definition is attached to.
	 *
	 */
	ownerType: MetafieldOwnerType;
	/**
	 * Whether to [pin](https://help.shopify.com/en/manual/custom-data/metafields/pinning-metafield-definitions?shpxid=50992205-75BA-4609-3F47-2325CF3B3B39) the metafield definition.
	 *
	 */
	pin?: boolean;
	/**
	 * Whether the metafield definition can be used as a collection condition.
	 */
	useAsCollectionCondition?: boolean;
	/**
	 * Whether metafields for the metafield definition are visible using the Storefront API. Use access.storefront instead.
	 *
	 */
	visibleToStorefrontApi?: boolean;
	// -> should be in fieldDefinition
	/** A set of field definitions to create on this metaobject definition. */
	fieldDefinition: (fields: Fields) => Field<any>;
};

export type MetafieldFieldType =
	| 'single_line_text_field'
	| 'list.single_line_text_field'
	| 'multi_line_text_field'
	| 'number_decimal'
	| 'list.number_decimal'
	| 'url'
	| 'list.url'
	| 'number_integer'
	| 'list.number_integer'
	| 'date'
	| 'list.date'
	| 'date_time'
	| 'list.date_time'
	| 'dimension'
	| 'list.dimension'
	| 'volume'
	| 'list.volume'
	| 'weight'
	| 'list.weight'
	| 'metaobject_reference'
	| 'product_reference' // not used before
	| 'list.product_reference' // not used before
	| 'file_reference' // not used before
	| 'list.file_reference'; // not used before

export interface MetafieldFieldDefinitionConfigWithType<
	TValidators extends Record<string, (...args: any[]) => MetafieldDefinitionValidationInput>,
> extends MetafieldFieldDefinitionConfig<TValidators> {
	type: MetafieldFieldType;
}

export type MetafieldDefinitionInput = {
	/** The access settings that apply to each of the metafields that belong to the metafield definition. */
	access?: MetafieldAccessInput;
	/** The description for the metafield definition. */
	description?: string;
	/**
	 * The unique identifier for the metafield definition within its namespace.
	 *
	 * Must be 3-64 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	key: string;
	/** The human-readable name for the metafield definition. */
	name: string;
	/**
	 * The container for a group of metafields that the metafield definition will be associated with. If omitted, the
	 * app-reserved namespace will be used.
	 *
	 * Must be 3-255 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	namespace?: string;
	/** The resource type that the metafield definition is attached to. */
	ownerType: MetafieldOwnerType;
	/**
	 * Whether to [pin](https://help.shopify.com/manual/custom-data/metafields/pinning-metafield-definitions)
	 * the metafield definition.
	 *
	 */
	pin?: boolean;
	/**
	 * The type of data that each of the metafields that belong to the metafield definition will store.
	 * Refer to the list of [supported types](https://shopify.dev/apps/metafields/types).
	 *
	 */
	type: string;
	/** Whether the metafield definition can be used as a collection condition. */
	useAsCollectionCondition?: boolean;
	/**
	 * A list of [validation options](https://shopify.dev/apps/metafields/definitions/validation) for
	 * the metafields that belong to the metafield definition. For example, for a metafield definition with the
	 * type `date`, you can set a minimum date validation so that each of the metafields that belong to it can only
	 * store dates after the specified minimum.
	 *
	 */
	validations?: MetafieldDefinitionValidationInput[];
	/** Whether metafields for the metafield definition are visible using the Storefront API. */
	visibleToStorefrontApi?: boolean;
};

export type MetafieldDefinitionUpdateInput = {
	id: string;
	// /** The access settings that apply to each of the metafields that belong to the metafield definition. */
	// access?: MetafieldAccessUpdateInput;
	/** The description for the metafield definition. */
	description?: string;
	/**
	 * The unique identifier for the metafield definition within its namespace. Used to help identify the metafield
	 * definition, but can't be updated itself.
	 *
	 */
	key: string;
	/** The human-readable name for the metafield definition. */
	name?: string;
	/**
	 * The container for a group of metafields that the metafield definition is associated with. Used to help identify
	 * the metafield definition, but cannot be updated itself. If omitted, the app-reserved namespace will be used.
	 *
	 */
	namespace?: string;
	/**
	 * The resource type that the metafield definition is attached to. Used to help identify the metafield definition,
	 * but can't be updated itself.
	 *
	 */
	ownerType: MetafieldOwnerType;
	/** Whether to pin the metafield definition. */
	pin?: boolean;
	/** Whether the metafield definition can be used as a collection condition. */
	useAsCollectionCondition?: boolean;
	/**
	 * A list of [validation options](https://shopify.dev/apps/metafields/definitions/validation) for
	 * the metafields that belong to the metafield definition. For example, for a metafield definition with the
	 * type `date`, you can set a minimum date validation so that each of the metafields that belong to it can only
	 * store dates after the specified minimum.
	 *
	 */
	validations?: MetafieldDefinitionValidationInput[];
	/**
	 * Whether each of the metafields that belong to the metafield definition are visible from the Storefront API.
	 *
	 */
	visibleToStorefrontApi?: boolean;
};

export type MutationMetafieldDefinitionCreateArgs = {
	definition: MetafieldDefinitionInput;
};

export type MutationMetafieldDefinitionUpdateArgs = {
	id: string;
	definition: MetafieldDefinitionUpdateInput;
};
