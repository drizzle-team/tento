import { Client } from '../gql-client';
import { Metafield } from '../metafield';
import {
	ListConfigSelectFields,
	UpdateConfig,
	UpdateResultItem,
	InferUpdatedMetafield,
	InferSelectModel,
	ListConfig,
	ListConfigQuery,
	ListResult,
	ResultItem,
	InferSelectMetafield,
	ListConfigUpdateFields,
} from './types';
import { KnownKeysOnly, ListConfigQueryItem } from '../types';

export class ShopifyProductOperations<TMetafieldSchema extends Record<string, Metafield>> {
	readonly _: {
		readonly product: InferSelectModel;
		readonly metafields: TMetafieldSchema;
	};

	constructor(private client: Client, metafields: TMetafieldSchema) {
		const asAny = {} as any;

		this._ = {
			product: {
				id: '1',
				createdAt: asAny,
				updatedAt: asAny,
				isGiftCard: true,
				category: asAny,
				options: [],
				compareAtPriceRange: asAny,
				defaultCursor: 'string',
				description: 'string',
				featuredImage: asAny,
				featuredMedia: asAny,
				feedback: asAny,
				hasOnlyDefaultVariant: true,
				hasOutOfStockVariants: true,
				hasVariantsThatRequiresComponents: true,
				legacyResourceId: 1,
				mediaCount: asAny,
				onlineStorePreviewUrl: 'string',
				onlineStoreUrl: 'string',
				priceRangeV2: asAny,
				sellingPlanGroupsCount: asAny,
				totalInventory: 1,
				tracksInventory: true,
				combinedListingRole: asAny,
				productType: 'string',
				descriptionHtml: 'string',
				giftCardTemplateSuffix: 'string',
				handle: 'string',
				requiresSellingPlan: true,
				seo: asAny,
				status: 'ACTIVE',
				tags: [],
				templateSuffix: 'string',
				title: 'string',
				vendor: 'string',
			},
			metafields,
		};
	}

	private buildMetafieldSelection(selectedMetafieldsName: string[]): string {
		const selectedMetafields = Object.values(this._.metafields).filter((metafield) =>
			selectedMetafieldsName.includes(metafield._.config.name),
		);

		let metafields = '';
		for (const metafield of selectedMetafields) {
			const { namespace, key, name } = metafield._.config;
			metafields += `${namespace ?? 'custom'}_${key ?? name.toLowerCase()}: metafield(namespace: "${
				namespace ?? 'custom'
			}", key: "${key ?? name.toLowerCase()}") { id, key, namespace, ownerType, type, value }`;
		}
		return metafields;
	}

	private buildItemSelection(selectedFields: Record<string, any>): string {
		return Object.entries(selectedFields)
			.map(([key, value]) => {
				if (key === 'metafields' && typeof value === 'object') {
					/**
					 * metafields: {
					 * 	<metafield_name>: "value"
					 * }
					 */
					return this.buildMetafieldSelection(Object.keys(value));
				}
				if (typeof value === 'object' && value !== null && !(value instanceof Date) && !Array.isArray(value)) {
					const innerStr = this.buildItemSelection(value);
					return `${key} { ${innerStr} }`;
				}
				return key;
			})
			.join(', ');
	}

	private mapItemResult<TUpdate extends UpdateConfig<TMetafieldSchema>>(
		node: any,
		updates: TUpdate,
		selectedMetafields: Metafield[],
	): UpdateResultItem<ListConfigUpdateFields<TUpdate['fields']>> {
		const result: Record<string, unknown> = {};

		for (let i = 0; i < Object.keys(updates.fields).length; i++) {
			const key = Object.keys(updates.fields)[i]!;

			if (key === 'metafields') {
				/**
				 * metafields: {
				 * 	<metafield_name>: "value"
				 * }
				 */
				const metafields: InferUpdatedMetafield[] = [];
				for (const tkey of Object.keys(updates.fields.metafields!)) {
					const metafield = selectedMetafields.find((selectedMetafield) => selectedMetafield._.config.name === tkey)!;
					const { key, namespace, name } = metafield._.config;
					const nodeValue = node[`${namespace ?? 'custom'}_${key ?? name.toLowerCase()}`];

					if (nodeValue) metafields.push(nodeValue);
				}

				result[key] = metafields;
			} else {
				const rawValue = node[key] ?? null;
				result[key] = rawValue;
			}
		}

		return result as any;
	}

	private getSelectedFields(fields: ListConfigSelectFields<InferSelectModel> | undefined): Record<string, true> {
		if (!fields) {
			return [...Object.keys(this._.product)].reduce<Record<string, true>>((acc, key) => {
				acc[key] = true;
				return acc;
			}, {});
		}

		let isExcludeMode = true;
		const selectedFields: Record<string, true> = {};
		for (const [key, value] of Object.entries(fields ?? {})) {
			if (value) {
				isExcludeMode = false;
			}
			selectedFields[key] = true;
		}
		if (Object.keys(selectedFields).length === 0) {
			throw new Error('At least one field must be selected');
		}
		if (isExcludeMode) {
			const result: Record<string, true> = {};
			for (const field of [...Object.keys(this._.product)]) {
				if (!(field in selectedFields)) {
					result[field] = true;
				}
			}
			return result;
		}

		return selectedFields;
	}

	private buildGetItemSelection(selectedFields: string[]): string {
		return selectedFields
			.map((field) => {
				if (field === 'metafields') {
					return Object.values(this._.metafields).map((metafield) => {
						const { namespace, key, name } = metafield._.config;
						return `${namespace ?? 'custom'}_${key ?? name.toLowerCase()}: metafield(namespace: "${
							namespace ?? 'custom'
						}", key: "${key ?? name.toLowerCase()}") { id, key, description, namespace, ownerType, type, value }`;
					});
				}
				if (field === 'category') {
					return `category {
                        fullName
                        id
                        isLeaf
                        isRoot
                        name
                        ancestorIds
                        childrenIds
                        isArchived
                        level
                        parentId
                    }`;
				}
				if (field === 'options') {
					return `options(first: 10) {
                        id
                        name
                        position
						values
                    }`;
				}
				if (field === 'compareAtPriceRange') {
					return `compareAtPriceRange {
                        maxVariantCompareAtPrice {
                            amount
                            currencyCode
                        }
                        minVariantCompareAtPrice {
                            amount
                            currencyCode
                        }    
                    }`;
				}
				if (field === 'featuredImage') {
					return `featuredImage {
                        altText
                        height
                        id
                        originalSrc
                        src
                        transformedSrc
                        url
                        width
						privateMetafields(first: 10) {
							nodes {
								createdAt
								id
								key
								namespace
								updatedAt
								value
								valueType
							}
						}
                    }`;
				}
				if (field === 'featuredMedia') {
					return `featuredMedia {
                        id
                        alt
                        status
						mediaContentType
						mediaErrors {
							code
							details
							message
						}
						mediaWarnings {
							code
							message
						}
						preview {
							image {
								altText
								height
								id
								url
								width
								originalSrc
								privateMetafields (first: 10) {
									nodes {
										createdAt
										id
										key
										namespace
										updatedAt
										value
										valueType
									}
								}
								transformedSrc
							}
							status
						}
                    }`;
				}
				if (field === 'feedback') {
					return `feedback {
                        summary
						details {
							link {
								label
								url
							}
							messages {
								field
								message
							}
						}
						appFeedback {
							link {
								label
								url
							}
							messages {
								field
								message
							}
						}
                    }`;
				}
				if (field === 'mediaCount') {
					return `mediaCount {
                        count
                        precision
                    }`;
				}
				if (field === 'priceRangeV2') {
					return `priceRangeV2 {
                        maxVariantPrice {
                            amount
                            currencyCode
                        }
                        minVariantPrice {
                            amount
                            currencyCode
                        }    
                    }`;
				}
				if (field === 'sellingPlanGroupsCount') {
					return `sellingPlanGroupsCount {
	                    count
	                    precision
                    }`;
				}
				if (field === 'seo') {
					return `seo {
                        description
                        title
                    }`;
				}

				return field;
			})
			.join(', ');
	}

	private mapGetItemResult<TFields extends ListConfigSelectFields<InferSelectModel>>(
		node: any,
		selectedFields: string[],
	): ResultItem<TFields> {
		const result: Record<string, unknown> = {};

		for (let i = 0; i < selectedFields.length; i++) {
			const key = selectedFields[i]!;
			if (key === 'metafields') {
				const metafields = Object.values(this._.metafields)
					.map((metafield) => {
						const { namespace, key, name } = metafield._.config;
						return node[`${namespace ?? 'custom'}_${key ?? name.toLowerCase()}`] as InferSelectMetafield;
					})
					.filter(Boolean);

				result[key] = metafields;
			} else {
				result[key] = node[key] ?? null;
			}
		}

		return result as any;
	}

	async list<TConfig extends ListConfig>(
		config?: KnownKeysOnly<TConfig, ListConfig>,
	): Promise<ListResult<TConfig['fields']>> {
		const allSelectedFieldsMap = this.getSelectedFields(config?.fields);
		const allSelectedFields = Object.keys(allSelectedFieldsMap);

		const query = `
			query ListProducts($query: String, $after: String, $before: String, $first: Int, $last: Int, $reverse: Boolean, $sortKey: ProductSortKeys, $savedSearchId: ID) {
				products(query: $query, after: $after, before: $before, first: $first, last: $last, reverse: $reverse, sortKey: $sortKey, savedSearchId: $savedSearchId) {
					edges {
						node {
                            ${this.buildGetItemSelection(allSelectedFields)}
						}
					}
					pageInfo {
						startCursor, endCursor, hasNextPage, hasPreviousPage
					}
				}
			}
		`;

		const first: TConfig['first'] | undefined =
			typeof config?.first !== 'number' && typeof config?.last !== 'number' ? 50 : config.first;
		const response = await this.client(query, {
			query: buildListQuery(config?.query),
			after: config?.after,
			before: config?.before,
			first,
			last: config?.last,
			reverse: config?.reverse,
			sortKey: config?.sortKey?.toUpperCase(),
			savedSearchId: config?.savedSearchId,
		});

		if (response.errors) {
			throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		const items = response.data.products.edges.map((edge: any) => this.mapGetItemResult(edge.node, allSelectedFields));

		return {
			items,
			pageInfo: response.data.products.pageInfo,
		};
	}

	async update<TUpdate extends UpdateConfig<TMetafieldSchema>>(
		id: string,
		updates: TUpdate,
	): Promise<UpdateResultItem<ListConfigUpdateFields<TUpdate['fields']>>> {
		const query = `
			mutation ProductUpdate($input: ProductInput!) {
				productUpdate(input: $input) {
					product {
						${this.buildItemSelection(updates.fields)}
					}
					userErrors {
						field, message
					}
				}
			}`;

		const metafields: {
			id?: string;
			namespace: string;
			key: string;
			value: string;
			type: string;
		}[] = [];
		let selectedMetafields: Metafield[] = [];
		if (updates.fields.metafields) {
			const metafieldNames = Object.keys(updates.fields.metafields!);
			selectedMetafields = Object.values(this._.metafields).filter((metafield) =>
				metafieldNames.includes(metafield._.config.name),
			);
			const productQuery = `
			    query GetProduct($id: ID!) {
			    	product(id: $id) {
			    		${this.buildMetafieldSelection(metafieldNames)}
			    	}
			    }
		    `;

			const productResponse = await this.client(productQuery, {
				id,
			});

			if (productResponse.errors) {
				throw new Error(productResponse.errors.graphQLErrors?.map((e) => e.message).join('\n'));
			}

			for (const [tkey, value] of Object.entries(updates.fields.metafields)) {
				const metafield = selectedMetafields.find((selectedMetafield) => selectedMetafield._.config.name === tkey)!;
				const { namespace, key, fieldDefinition, name } = metafield._.config;

				metafields.push({
					id: productResponse.data?.product[`${namespace ?? 'custom'}_${key ?? name.toLowerCase()}`]?.id ?? undefined,
					namespace: namespace ?? 'custom',
					key: key ?? name.toLowerCase(),
					value: value!.toString(),
					type: fieldDefinition.type,
				});
			}
		}
		const fields: Record<string, any> = {};
		for (const [key, value] of Object.entries(updates.fields)) {
			if (key !== 'metafields') {
				fields[key] = value;
			}
		}
		if (Object.values(metafields).length > 0) {
			fields['metafields'] = metafields;
		}

		const response = await this.client(query, {
			input: {
				id,
				...fields,
			},
		});

		if (response.errors) {
			throw new Error(response.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		if (response.data?.productUpdate?.userErrors.length) {
			throw new Error(response.data.productUpdate.userErrors.map((e: any) => e.message).join('\n'));
		}

		return this.mapItemResult(response.data?.productUpdate.product, updates, selectedMetafields);
	}
}

export function buildListQueryItem(query: ListConfigQueryItem<string | number | boolean | Date>): string {
	if (typeof query === 'string' || typeof query === 'number' || typeof query === 'boolean') {
		return `"${query}"`;
	}
	if (query instanceof Date) {
		return `"${query.toISOString()}"`;
	}
	if (Object.keys(query).length > 1) {
		throw new Error(`Query item must have only one key: ${JSON.stringify(query)}`);
	}
	if ('$raw' in query && query.$raw !== undefined) {
		return query.$raw;
	}
	if ('$not' in query && query.$not !== undefined) {
		return `NOT ${buildListQueryItem(query.$not)}`;
	}
	if ('$lt' in query && query.$lt !== undefined) {
		return `<${buildListQueryItem(query.$lt)}`;
	}
	if ('$lte' in query && query.$lte !== undefined) {
		return `<=${buildListQueryItem(query.$lte)}`;
	}
	if ('$gt' in query && query.$gt !== undefined) {
		return `>${buildListQueryItem(query.$gt)}`;
	}
	if ('$gte' in query && query.$gte !== undefined) {
		return `>=${buildListQueryItem(query.$gte)}`;
	}
	throw new Error(`Invalid query item: ${JSON.stringify(query)}`);
}

// TODO() check all of them
export function buildListQuery(query: ListConfigQuery | undefined): string | undefined {
	if (query === undefined) {
		return undefined;
	}
	// TODO() We don't have just a string | numbder | boolean param in query
	// if (typeof query === 'string' || typeof query === 'number' || typeof query === 'boolean') {
	//     return `"${query}"`;
	// }
	// if (query instanceof Date) {
	//     return `"${query.toISOString()}"`;
	// }
	if (Array.isArray(query)) {
		return `(${query.map(buildListQuery).join(' AND ')})`;
	}
	if ('$raw' in query) {
		if (Object.keys(query).length > 1) {
			throw new Error(`$raw must be the only key in the query: ${JSON.stringify(query)}`);
		}
		return query.$raw;
	}
	if ('$or' in query) {
		if (Object.keys(query).length > 1) {
			throw new Error(`$or must be the only key in the query: ${JSON.stringify(query)}`);
		}
		return `(${query.$or.map(buildListQuery).join(' OR ')})`;
	}
	const parts: string[] = [];
	if ('title' in query && query.title !== undefined) {
		parts.push(`title:${buildListQueryItem(query.title)}`);
	}
	if ('updatedAt' in query && query.updatedAt !== undefined) {
		parts.push(`updated_at:${buildListQueryItem(query.updatedAt)}`);
	}
	if ('default' in query && query.default !== undefined) {
		parts.push(`default:${buildListQueryItem(query.default)}`);
	}
	if ('barcode' in query && query.barcode !== undefined) {
		parts.push(`barcode:${buildListQueryItem(query.barcode)}`);
	}
	if ('bundles' in query && query.bundles !== undefined) {
		parts.push(`bundles:${buildListQueryItem(query.bundles)}`);
	}
	if ('categoryId' in query && query.categoryId !== undefined) {
		parts.push(`category_id:${buildListQueryItem(query.categoryId)}`);
	}
	if ('combinedListingRole' in query && query.combinedListingRole !== undefined) {
		parts.push(`combined_listing_role:${buildListQueryItem(query.combinedListingRole.toLowerCase())}`);
	}
	if ('createdAt' in query && query.createdAt !== undefined) {
		parts.push(`created_at:${buildListQueryItem(query.createdAt)}`);
	}
	// TODO() ???
	if ('deliveryProfileId' in query && query.deliveryProfileId !== undefined) {
		parts.push(`delivery_profile_id:${buildListQueryItem(query.deliveryProfileId)}`);
	}
	if ('giftCard' in query && query.giftCard !== undefined) {
		parts.push(`gift_card:${buildListQueryItem(query.giftCard)}`);
	}
	if ('handle' in query && query.handle !== undefined) {
		parts.push(`handle:${buildListQueryItem(query.handle)}`);
	}
	if ('hasOnlyComposites' in query && query.hasOnlyComposites !== undefined) {
		parts.push(`has_only_composites:${buildListQueryItem(query.hasOnlyComposites)}`);
	}
	if ('hasOnlyDefaultVariant' in query && query.hasOnlyDefaultVariant !== undefined) {
		parts.push(`has_only_default_variant:${buildListQueryItem(query.hasOnlyDefaultVariant)}`);
	}
	if ('hasVariantWithComponents' in query && query.hasVariantWithComponents !== undefined) {
		parts.push(`has_variant_with_components:${buildListQueryItem(query.hasVariantWithComponents)}`);
	}
	if ('id' in query && query.id !== undefined) {
		parts.push(`id:${buildListQueryItem(query.id)}`);
	}
	if ('inventoryTotal' in query && query.inventoryTotal !== undefined) {
		parts.push(`inventory_total:${buildListQueryItem(query.inventoryTotal)}`);
	}
	if ('isPriceReduced' in query && query.isPriceReduced !== undefined) {
		parts.push(`is_price_reduced:${buildListQueryItem(query.isPriceReduced)}`);
	}
	if ('outOfStockSomewhere' in query && query.outOfStockSomewhere !== undefined) {
		parts.push(`out_of_stock_somewhere:${buildListQueryItem(query.outOfStockSomewhere)}`);
	}
	if ('price' in query && query.price !== undefined) {
		parts.push(`price:${buildListQueryItem(query.price)}`);
	}
	if ('productConfigurationOwner' in query && query.productConfigurationOwner !== undefined) {
		parts.push(`product_configuration_owner:${buildListQueryItem(query.productConfigurationOwner)}`);
	}
	// TODO() made it as function first
	// if ('productPublicationStatus' in query && query.productPublicationStatus !== undefined) {
	//     parts.push(`product_publication_status:${buildListQueryItem(query.productPublicationStatus)}`);
	// }
	if ('productType' in query && query.productType !== undefined) {
		parts.push(`product_type:${buildListQueryItem(query.productType)}`);
	}
	if ('publishableStatus' in query && query.publishableStatus !== undefined) {
		parts.push(`publishable_status:${buildListQueryItem(query.publishableStatus.toLowerCase())}`);
	}
	if ('publishedAt' in query && query.publishedAt !== undefined) {
		parts.push(`published_at:${buildListQueryItem(query.publishedAt)}`);
	}
	if ('publishedStatus' in query && query.publishedStatus !== undefined) {
		parts.push(`published_status:${buildListQueryItem(query.publishedStatus.toLowerCase())}`);
	}
	if ('sku' in query && query.sku !== undefined) {
		parts.push(`sku:${buildListQueryItem(query.sku)}`);
	}
	if ('status' in query && query.status !== undefined) {
		parts.push(`status:${buildListQueryItem(query.status)}`);
	}
	if ('tag' in query && query.tag !== undefined) {
		parts.push(`tag:${buildListQueryItem(query.tag)}`);
	}
	if ('tagNot' in query && query.tagNot !== undefined) {
		parts.push(`tag_not:${buildListQueryItem(query.tagNot)}`);
	}
	if ('vendor' in query && query.vendor !== undefined) {
		parts.push(`vendor:${buildListQueryItem(query.vendor)}`);
	}

	return parts.join(' AND ');
}
