import type {
	MetaobjectAdminAccess,
	MetaobjectCapabilityCreateInput,
	MetaobjectStorefrontAccess,
} from '../../graphql/gen/graphql';
import { ListConfigQueryItem, MetafieldDefinitionValidationInput, ShopifizzleTypeError } from '../types';
import type { Field, Fields } from './field';
import { Metaobject } from './metaobject';

export type Simplify<T> = {
	[K in keyof T]: T[K];
} & {};

export type InferBaseModel<T extends MetaobjectDefinitionConfig> = ReturnType<
	T['fieldDefinitions']
> extends infer TFields extends Record<string, Field<any, any>>
	? Simplify<
			{
				[K in keyof TFields & string as RequiredKeyOnly<K, TFields>]: TFields[K]['_']['type'];
			} & {
				[K in keyof TFields & string as OptionalKeyOnly<K, TFields>]: TFields[K]['_']['type'] | null;
			}
	  >
	: never;

export type InferSelectModel<TBase> = Simplify<
	{
		_id: string;
		_handle: string;
		_displayName: string;
		_updatedAt: Date;
	} & TBase
>;

export type RequiredKeyOnly<
	TKey extends string,
	TFields extends Record<string, Field<any, any>>,
> = TFields[TKey]['_']['required'] extends true ? TKey : never;

export type OptionalKeyOnly<
	TKey extends string,
	TFields extends Record<string, Field<any, any>>,
> = TKey extends RequiredKeyOnly<TKey, TFields> ? never : TKey;

export type InferInsertModel<T extends MetaobjectDefinitionConfig> = ReturnType<
	T['fieldDefinitions']
> extends infer TFields extends Record<string, Field<any, any>>
	? Simplify<
			{
				[K in keyof TFields & string as RequiredKeyOnly<K, TFields>]: TFields[K]['_']['type'];
			} & {
				[K in keyof TFields & string as OptionalKeyOnly<K, TFields>]?: TFields[K]['_']['type'];
			}
	  >
	: never;

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
	name: string;
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
	TRequired extends boolean = boolean,
> {
	/** An administrative description of the field. */
	description?: string;
	/** A human-readable name for the field. This can be changed at any time. */
	name?: string;
	/** Whether metaobjects require a saved value for the field. */
	required?: TRequired;
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

export type MetaobjectFieldType =
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
	| 'list.weight';

export interface MetaobjectFieldDefinitionConfigWithType<
	TValidators extends Record<string, (...args: any[]) => MetafieldDefinitionValidationInput>,
	TRequiered extends boolean = false,
> extends MetaobjectFieldDefinitionConfig<TValidators, TRequiered> {
	type: MetaobjectFieldType;
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

export type SortKey = 'id' | 'type' | 'updated_at' | 'display_name';

export type ListConfigFields<T extends Metaobject<any>> = {
	[K in keyof T['$inferSelect']]?: boolean | 0 | 1;
};

export type ListConfigQuery =
	| string
	| {
			displayName?: ListConfigQueryItem<string>;
			updatedAt?: ListConfigQueryItem<Date | string>;
			id?: ListConfigQueryItem<string>;
			handle?: ListConfigQueryItem<string>;
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
	first?: number; // or last required
	last?: number; // or first required
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
	TFields extends ListConfigFields<T> | undefined = undefined,
> = TFields extends undefined
	? T['$inferSelect']
	: TFields[keyof TFields] extends false
	  ? {
				[K in Exclude<keyof T['$inferSelect'], keyof TFields>]: T['$inferSelect'][K];
		  }
	  : Simplify<
				{
					[K in keyof TFields as TFields[K] extends true ? K : never]: K extends keyof T['$inferSelect']
						? T['$inferSelect'][K]
						: never;
				} & {
					[K2 in keyof TFields as boolean extends TFields[K2] ? K2 : never]: ShopifizzleTypeError<`'${K2 &
						string}' must be either static true or static false, not a dynamic value`>;
				}
		  >;

export type ListResult<
	T extends Metaobject<any>,
	TFields extends ListConfigFields<T> | undefined = undefined,
> = Simplify<{
	items: ResultItem<T, TFields>[];
	pageInfo: {
		startCursor: string;
		endCursor: string;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}>;
