import type { Field, Fields } from './field';
import type { Metaobject } from './metaobject';

export type InferBaseModel<T extends MetaobjectDefinitionConfig> = ReturnType<
	T['fieldDefinitions']
> extends infer TFields extends Record<string, Field<any>>
	? {
			[K in keyof TFields]: TFields[K]['_']['type'];
	  }
	: never;

export type Simplify<T> = {
	[K in keyof T]: T[K];
} & {};

export type InferSelectModel<TBase> = Simplify<
	{
		_id: string;
		_handle: string;
		_updatedAt: Date;
	} & TBase
>;

export type InferUpdateModel<TBase> = Simplify<
	Partial<
		{
			_handle: string;
		} & TBase
	>
>;

/** The input fields for creating a metaobject definition. */
export type MetaobjectDefinitionConfig = {
	/** Access configuration for the metaobjects created with this definition. */
	access?: MetaobjectAccessInput;
	/** The capabilities of the metaobject definition. */
	capabilities?: MetaobjectCapabilityCreateInput;
	/** An administrative description of the definition. */
	description?: string;
	/** The key of a field to reference as the display name for metaobjects of this type. */
	displayNameKey?: string;
	/** A set of field definitions to create on this metaobject definition. */
	fieldDefinitions: (fields: Fields) => Record<string, Field<any>>;
	/** A human-readable name for the definition. This can be changed at any time. */
	name?: string;
	/**
	 * The type of the metaobject definition. This can't be changed.
	 *
	 * Must be 3-255 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	type: string;
};

/** The input fields for creating a metaobject definition. */
export type MetaobjectDefinition = Omit<MetaobjectDefinitionConfig, 'fieldDefinitions'> & {
	/** A set of field definitions to create on this metaobject definition. */
	fieldDefinitions: MetaobjectFieldDefinition[];
};

export interface MetaobjectFieldDefinitions {
	[key: string]: Omit<MetaobjectFieldDefinitionConfig<any>, 'key'>;
}

/** The input fields for creating a metaobject field definition. */
export interface MetaobjectFieldDefinitionConfig<
	TValidators extends Record<string, (...args: any[]) => MetafieldDefinitionValidationInput> = Record<string, never>,
> {
	/** An administrative description of the field. */
	description?: string;
	/** A human-readable name for the field. This can be changed at any time. */
	name?: string;
	/** Whether metaobjects require a saved value for the field. */
	required?: boolean;
	/**
	 * The key of the new field definition. This can't be changed.
	 *
	 * Must be 3-64 characters long and only contain alphanumeric, hyphen, and underscore characters.
	 *
	 */
	key?: string;
	/** Custom validations that apply to values assigned to the field. */
	validations?: (validators: TValidators) => MetafieldDefinitionValidationInput[];
}

export interface MetaobjectFieldDefinitionConfigWithType<
	TValidators extends Record<string, (...args: any[]) => MetafieldDefinitionValidationInput>,
> extends MetaobjectFieldDefinitionConfig<TValidators> {
	type: string;
}

/** The input fields for creating a metaobject field definition. */
export type MetaobjectFieldDefinition = Omit<MetaobjectFieldDefinitionConfig<any>, 'validations' | 'key'> & {
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

export type MetaobjectFieldDefinitionBuilder = Omit<MetaobjectFieldDefinition, 'key'> &
	Partial<Pick<MetaobjectFieldDefinition, 'key'>>;

/**
 * The name and value for a metafield definition validation.
 *
 * For example, for a metafield definition of `single_line_text_field` type, you can set a validation with the name `min` and a value of `10`.
 * This validation will ensure that the value of the metafield is at least 10 characters.
 *
 * Refer to the [list of supported validations](https://shopify.dev/api/admin/graphql/reference/common-objects/metafieldDefinitionTypes#examples-Fetch_all_metafield_definition_types).
 *
 */
export type MetafieldDefinitionValidationInput = {
	/** The name for the metafield definition validation. */
	name: string;
	/** The value for the metafield definition validation. */
	value: string;
};

/** The input fields for configuring metaobject access controls. */
export type MetaobjectAccessInput = {
	/**
	 * Access configuration for Admin API surface areas, including the GraphQL Admin API.
	 *
	 */
	admin?: MetaobjectAdminAccess;
	/**
	 * Access configuration for Storefront API surface areas, including the GraphQL Storefront API and Liquid.
	 *
	 */
	storefront?: MetaobjectStorefrontAccess;
};

/** Defines how the metaobjects of a definition can be accessed in admin API surface areas. */
export enum MetaobjectAdminAccess {
	/**
	 * Applications that act on behalf of merchants can read metaobjects.
	 * Only the owning application can write metaobjects.
	 *
	 */
	MerchantRead = 'MERCHANT_READ',
	/**
	 * The owning application, as well as applications that act on behalf of merchants can read and write metaobjects.
	 * No other applications can read or write metaobjects.
	 *
	 */
	MerchantReadWrite = 'MERCHANT_READ_WRITE',
	/**
	 * Only the application that owns a metaobject can read and write to it.
	 *
	 */
	Private = 'PRIVATE',
	/**
	 * All applications with the `metaobjects` access scope can read metaobjects.
	 * Only the owning application can write metaobjects.
	 *
	 */
	PublicRead = 'PUBLIC_READ',
	/**
	 * All applications with the `metaobjects` access scope can read and write metaobjects.
	 *
	 */
	PublicReadWrite = 'PUBLIC_READ_WRITE',
}

/**
 * Defines how the metaobjects of a definition can be accessed in Storefront API surface areas, including Liquid and the GraphQL Storefront API.
 *
 */
export enum MetaobjectStorefrontAccess {
	/**
	 * Metaobjects are not accessible in any Storefront API surface area.
	 *
	 */
	None = 'NONE',
	/**
	 * Metaobjects are accessible in the GraphQL Storefront API by any application with the `unauthenticated_read_metaobjects` access scope.
	 * Metaobjects are accessible in online store Liquid templates.
	 *
	 */
	PublicRead = 'PUBLIC_READ',
}

/** The input fields for creating a metaobject capability. */
export type MetaobjectCapabilityCreateInput = {
	/** The input for enabling the publishable capability. */
	publishable?: MetaobjectCapabilityPublishableInput;
	/** The input for enabling the translatable capability. */
	translatable?: MetaobjectCapabilityTranslatableInput;
};

/** The input fields for enabling and disabling the publishable capability. */
export type MetaobjectCapabilityPublishableInput = {
	/** Indicates whether the capability should be enabled or disabled. */
	enabled: boolean;
};

/** The input fields for enabling and disabling the translatable capability. */
export type MetaobjectCapabilityTranslatableInput = {
	/** Indicates whether the capability should be enabled or disabled. */
	enabled: boolean;
};

export type ExtractSchema<TSchema extends Record<string, unknown>> = Simplify<{
	[K in keyof TSchema as TSchema[K] extends Metaobject<any> ? K : never]: TSchema[K] extends Metaobject<any>
		? TSchema[K]
		: never;
}>;

export type KnownKeysOnly<T, U> = {
	[K in keyof T]: K extends keyof U ? T[K] : never;
};

export interface ShopifizzleTypeError<T extends string> {
	$error: T;
}

export type SortKey = 'id' | 'type' | 'updated_at' | 'display_name';

export type ListConfigFields<T extends Metaobject<any>> = {
	[K in keyof T['$inferSelect']]?: boolean | 0 | 1;
};

export type ListConfigQueryItem<T> =
	| {
			/**
			 * A raw query string to be used as-is in the request. Incompatible with other query properties.
			 */
			$raw?: string;
			/**
			 * A search that excludes documents that include the specified value.
			 */
			$not?: ListConfigQueryItem<T>;
			/**
			 * A search that includes documents where the value is less than the specified value.
			 */
			$lt?: ListConfigQueryItem<T>;
			/**
			 * A search that includes documents where the value is less than or equal to the specified value.
			 */
			$lte?: ListConfigQueryItem<T>;
			/**
			 * A search that includes documents where the value is greater than the specified value.
			 */
			$gt?: ListConfigQueryItem<T>;
			/**
			 * A search that includes documents where the value is greater than or equal to the specified value.
			 */
			$gte?: ListConfigQueryItem<T>;
	  }
	| T;

export type ListConfigQuery =
	| string
	| {
			displayName?: ListConfigQueryItem<string>;
			updatedAt?: ListConfigQueryItem<Date | string>;
	  }
	| {
			/**
			 * A raw query string to be used as-is in the request. Incompatible with other query properties.
			 */
			$raw: string;
	  }
	| {
			/**
			 * A list of queries that are combined with `OR`.
			 */
			$or: ListConfigQuery[];
	  }
	| ListConfigQuery[];

export interface ListConfig<T extends Metaobject<any>> {
	fields?: ListConfigFields<T>;
	query?: ListConfigQuery;
	after?: string;
	before?: string;
	first?: number;
	last?: number;
	reverse?: boolean;
	sortKey?: SortKey;
}

export interface IteratorConfig<T extends Metaobject<any>> {
	fields?: ListConfigFields<T>;
	query?: ListConfigQuery;
	reverse?: boolean;
	sortKey?: SortKey;
	pageSize?: number;
	limit?: number;
}

export interface UpdateConfig<T extends Metaobject<any>> {
	capabilities?: {
		publishable: {
			status: 'ACTIVE' | 'DRAFT';
		};
	};
	fields?: T['$inferUpdate'];
}

export type ResultItem<
	T extends Metaobject<any>,
	TFields extends ListConfigFields<T> | undefined,
> = TFields extends undefined
	? T['$inferSelect']
	: TFields[keyof TFields] extends false
	  ? {
				[K in Exclude<keyof T['$inferSelect'], keyof TFields>]: T['$inferSelect'][K];
		  }
	  : Simplify<
				{
					[K in keyof TFields as TFields[K] extends true ? K : never]: T['$inferSelect'][K];
				} & {
					[K2 in keyof TFields as boolean extends TFields[K2] ? K2 : never]: ShopifizzleTypeError<`'${K2 &
						string}' must be either static true or static false, not a dynamic value`>;
				}
		  >;

export type ListResult<T extends Metaobject<any>, TFields extends ListConfigFields<T> | undefined> = Simplify<{
	items: ResultItem<T, TFields>[];
	pageInfo: {
		startCursor: string;
		endCursor: string;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}>;
