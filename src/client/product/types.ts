import { Metafield } from '../metafield';
import { MetafieldFieldType } from '../metafield/types';
import { ListConfigQueryItem, MetafieldOwnerType } from '../types';

export type Simplify<T> = T extends Date
	? Date
	: {
			[K in keyof T]: T[K];
	  } & {};

export type InferSelectMetafield = Simplify<{
	/** A globally-unique metafield ID. */
	id: string;
	/** The unique identifier for the metafield within its namespace. */
	key: string;
	/** The container for a group of metafields that the metafield is associated with. */
	namespace: string;
	/** The description of the metafield. */
	description?: string;
	/** The type of resource that the metafield is attached to. */
	ownerType: Simplify<MetafieldOwnerType>;
	/** The type of data that is stored in the metafield. Refer to the list of [supported types](https://shopify.dev/apps/metafields/types). */
	type: Simplify<MetafieldFieldType>;
	/** The data stored in the metafield. Always stored as a string, regardless of the metafield's type. */
	value: string;
}>;

export type InferUpdatedMetafield = Simplify<Omit<InferSelectMetafield, 'description'>>;

export type Translation = Simplify<{
	/** On the resource that this translation belongs to, the reference to the value being translated. */
	key: string;
	/** ISO code of the translation locale. */
	locale: string;
	/** Whether the original content has changed since this translation was updated. */
	outdated: boolean;
	/** The date and time when the translation was updated. */
	updatedAt?: Date;
	/** Translation value. */
	value?: string;
}>;

/**
 * The product property names. For example, "Size", "Color", and "Material".
 * Variants are selected based on permutations of these options.
 * The limit for each product property name is 255 characters.
 *
 */
export type ProductOption = Simplify<{
	/** A globally-unique ID. */
	id: string;
	/** The product option’s name. */
	name: string;
	/** The product option's position. */
	position: number;
	/** The translations associated with the resource. */
	// TODO() if we need to get translations -> we must provide locale filter
	// translations: Translation[];
	/** The corresponding value to the product option name. */
	values: string[];
}>;

/**
 * The three-letter currency codes that represent the world currencies used in stores. These include standard ISO 4217 codes, legacy codes,
 * and non-standard codes.
 *
 */
export type CurrencyCode =
	/** United Arab Emirates Dirham (AED). */
	| 'AED'
	/** Afghan Afghani (AFN). */
	| 'AFN'
	/** Albanian Lek (ALL). */
	| 'ALL'
	/** Armenian Dram (AMD). */
	| 'AMD'
	/** Netherlands Antillean Guilder. */
	| 'ANG'
	/** Angolan Kwanza (AOA). */
	| 'AOA'
	/** Argentine Pesos (ARS). */
	| 'ARS'
	/** Australian Dollars (AUD). */
	| 'AUD'
	/** Aruban Florin (AWG). */
	| 'AWG'
	/** Azerbaijani Manat (AZN). */
	| 'AZN'
	/** Bosnia and Herzegovina Convertible Mark (BAM). */
	| 'BAM'
	/** Barbadian Dollar (BBD). */
	| 'BBD'
	/** Bangladesh Taka (BDT). */
	| 'BDT'
	/** Bulgarian Lev (BGN). */
	| 'BGN'
	/** Bahraini Dinar (BHD). */
	| 'BHD'
	/** Burundian Franc (BIF). */
	| 'BIF'
	/** Bermudian Dollar (BMD). */
	| 'BMD'
	/** Brunei Dollar (BND). */
	| 'BND'
	/** Bolivian Boliviano (BOB). */
	| 'BOB'
	/** Brazilian Real (BRL). */
	| 'BRL'
	/** Bahamian Dollar (BSD). */
	| 'BSD'
	/** Bhutanese Ngultrum (BTN). */
	| 'BTN'
	/** Botswana Pula (BWP). */
	| 'BWP'
	/** Belarusian Ruble (BYN). */
	| 'BYN'
	/**
	 * Belarusian Ruble (BYR).
	 * @deprecated `BYR` is deprecated. Use `BYN` available from version `2021-01` onwards instead.
	 */
	| 'BYR'
	/** Belize Dollar (BZD). */
	| 'BZD'
	/** Canadian Dollars (CAD). */
	| 'CAD'
	/** Congolese franc (CDF). */
	| 'CDF'
	/** Swiss Francs (CHF). */
	| 'CHF'
	/** Chilean Peso (CLP). */
	| 'CLP'
	/** Chinese Yuan Renminbi (CNY). */
	| 'CNY'
	/** Colombian Peso (COP). */
	| 'COP'
	/** Costa Rican Colones (CRC). */
	| 'CRC'
	/** Cape Verdean escudo (CVE). */
	| 'CVE'
	/** Czech Koruny (CZK). */
	| 'CZK'
	/** Djiboutian Franc (DJF). */
	| 'DJF'
	/** Danish Kroner (DKK). */
	| 'DKK'
	/** Dominican Peso (DOP). */
	| 'DOP'
	/** Algerian Dinar (DZD). */
	| 'DZD'
	/** Egyptian Pound (EGP). */
	| 'EGP'
	/** Eritrean Nakfa (ERN). */
	| 'ERN'
	/** Ethiopian Birr (ETB). */
	| 'ETB'
	/** Euro (EUR). */
	| 'EUR'
	/** Fijian Dollars (FJD). */
	| 'FJD'
	/** Falkland Islands Pounds (FKP). */
	| 'FKP'
	/** United Kingdom Pounds (GBP). */
	| 'GBP'
	/** Georgian Lari (GEL). */
	| 'GEL'
	/** Ghanaian Cedi (GHS). */
	| 'GHS'
	/** Gibraltar Pounds (GIP). */
	| 'GIP'
	/** Gambian Dalasi (GMD). */
	| 'GMD'
	/** Guinean Franc (GNF). */
	| 'GNF'
	/** Guatemalan Quetzal (GTQ). */
	| 'GTQ'
	/** Guyanese Dollar (GYD). */
	| 'GYD'
	/** Hong Kong Dollars (HKD). */
	| 'HKD'
	/** Honduran Lempira (HNL). */
	| 'HNL'
	/** Croatian Kuna (HRK). */
	| 'HRK'
	/** Haitian Gourde (HTG). */
	| 'HTG'
	/** Hungarian Forint (HUF). */
	| 'HUF'
	/** Indonesian Rupiah (IDR). */
	| 'IDR'
	/** Israeli New Shekel (NIS). */
	| 'ILS'
	/** Indian Rupees (INR). */
	| 'INR'
	/** Iraqi Dinar (IQD). */
	| 'IQD'
	/** Iranian Rial (IRR). */
	| 'IRR'
	/** Icelandic Kronur (ISK). */
	| 'ISK'
	/** Jersey Pound. */
	| 'JEP'
	/** Jamaican Dollars (JMD). */
	| 'JMD'
	/** Jordanian Dinar (JOD). */
	| 'JOD'
	/** Japanese Yen (JPY). */
	| 'JPY'
	/** Kenyan Shilling (KES). */
	| 'KES'
	/** Kyrgyzstani Som (KGS). */
	| 'KGS'
	/** Cambodian Riel. */
	| 'KHR'
	/** Kiribati Dollar (KID). */
	| 'KID'
	/** Comorian Franc (KMF). */
	| 'KMF'
	/** South Korean Won (KRW). */
	| 'KRW'
	/** Kuwaiti Dinar (KWD). */
	| 'KWD'
	/** Cayman Dollars (KYD). */
	| 'KYD'
	/** Kazakhstani Tenge (KZT). */
	| 'KZT'
	/** Laotian Kip (LAK). */
	| 'LAK'
	/** Lebanese Pounds (LBP). */
	| 'LBP'
	/** Sri Lankan Rupees (LKR). */
	| 'LKR'
	/** Liberian Dollar (LRD). */
	| 'LRD'
	/** Lesotho Loti (LSL). */
	| 'LSL'
	/** Lithuanian Litai (LTL). */
	| 'LTL'
	/** Latvian Lati (LVL). */
	| 'LVL'
	/** Libyan Dinar (LYD). */
	| 'LYD'
	/** Moroccan Dirham. */
	| 'MAD'
	/** Moldovan Leu (MDL). */
	| 'MDL'
	/** Malagasy Ariary (MGA). */
	| 'MGA'
	/** Macedonia Denar (MKD). */
	| 'MKD'
	/** Burmese Kyat (MMK). */
	| 'MMK'
	/** Mongolian Tugrik. */
	| 'MNT'
	/** Macanese Pataca (MOP). */
	| 'MOP'
	/** Mauritanian Ouguiya (MRU). */
	| 'MRU'
	/** Mauritian Rupee (MUR). */
	| 'MUR'
	/** Maldivian Rufiyaa (MVR). */
	| 'MVR'
	/** Malawian Kwacha (MWK). */
	| 'MWK'
	/** Mexican Pesos (MXN). */
	| 'MXN'
	/** Malaysian Ringgits (MYR). */
	| 'MYR'
	/** Mozambican Metical. */
	| 'MZN'
	/** Namibian Dollar. */
	| 'NAD'
	/** Nigerian Naira (NGN). */
	| 'NGN'
	/** Nicaraguan Córdoba (NIO). */
	| 'NIO'
	/** Norwegian Kroner (NOK). */
	| 'NOK'
	/** Nepalese Rupee (NPR). */
	| 'NPR'
	/** New Zealand Dollars (NZD). */
	| 'NZD'
	/** Omani Rial (OMR). */
	| 'OMR'
	/** Panamian Balboa (PAB). */
	| 'PAB'
	/** Peruvian Nuevo Sol (PEN). */
	| 'PEN'
	/** Papua New Guinean Kina (PGK). */
	| 'PGK'
	/** Philippine Peso (PHP). */
	| 'PHP'
	/** Pakistani Rupee (PKR). */
	| 'PKR'
	/** Polish Zlotych (PLN). */
	| 'PLN'
	/** Paraguayan Guarani (PYG). */
	| 'PYG'
	/** Qatari Rial (QAR). */
	| 'QAR'
	/** Romanian Lei (RON). */
	| 'RON'
	/** Serbian dinar (RSD). */
	| 'RSD'
	/** Rwandan Franc (RWF). */
	| 'RWF'
	/** Saudi Riyal (SAR). */
	| 'SAR'
	/** Solomon Islands Dollar (SBD). */
	| 'SBD'
	/** Seychellois Rupee (SCR). */
	| 'SCR'
	/** Sudanese Pound (SDG). */
	| 'SDG'
	/** Swedish Kronor (SEK). */
	| 'SEK'
	/** Singapore Dollars (SGD). */
	| 'SGD'
	/** Saint Helena Pounds (SHP). */
	| 'SHP'
	/** Sierra Leonean Leone (SLL). */
	| 'SLL'
	/** Somali Shilling (SOS). */
	| 'SOS'
	/** Surinamese Dollar (SRD). */
	| 'SRD'
	/** South Sudanese Pound (SSP). */
	| 'SSP'
	/**
	 * Sao Tome And Principe Dobra (STD).
	 * @deprecated `STD` is deprecated. Use `STN` available from version `2022-07` onwards instead.
	 */
	| 'STD'
	/** Sao Tome And Principe Dobra (STN). */
	| 'STN'
	/** Syrian Pound (SYP). */
	| 'SYP'
	/** Swazi Lilangeni (SZL). */
	| 'SZL'
	/** Thai baht (THB). */
	| 'THB'
	/** Tajikistani Somoni (TJS). */
	| 'TJS'
	/** Turkmenistani Manat (TMT). */
	| 'TMT'
	/** Tunisian Dinar (TND). */
	| 'TND'
	/** Tongan Pa'anga (TOP). */
	| 'TOP'
	/** Turkish Lira (TRY). */
	| 'TRY'
	/** Trinidad and Tobago Dollars (TTD). */
	| 'TTD'
	/** Taiwan Dollars (TWD). */
	| 'TWD'
	/** Tanzanian Shilling (TZS). */
	| 'TZS'
	/** Ukrainian Hryvnia (UAH). */
	| 'UAH'
	/** Ugandan Shilling (UGX). */
	| 'UGX'
	/** United States Dollars (USD). */
	| 'USD'
	/** Uruguayan Pesos (UYU). */
	| 'UYU'
	/** Uzbekistan som (UZS). */
	| 'UZS'
	/** Venezuelan Bolivares (VED). */
	| 'VED'
	/**
	 * Venezuelan Bolivares (VEF).
	 * @deprecated `VEF` is deprecated. Use `VES` available from version `2020-10` onwards instead.
	 */
	| 'VEF'
	/** Venezuelan Bolivares Soberanos (VES). */
	| 'VES'
	/** Vietnamese đồng (VND). */
	| 'VND'
	/** Vanuatu Vatu (VUV). */
	| 'VUV'
	/** Samoan Tala (WST). */
	| 'WST'
	/** Central African CFA Franc (XAF). */
	| 'XAF'
	/** East Caribbean Dollar (XCD). */
	| 'XCD'
	/** West African CFA franc (XOF). */
	| 'XOF'
	/** CFP Franc (XPF). */
	| 'XPF'
	/** Unrecognized currency. */
	| 'XXX'
	/** Yemeni Rial (YER). */
	| 'YER'
	/** South African Rand (ZAR). */
	| 'ZAR'
	/** Zambian Kwacha (ZMW). */
	| 'ZMW';

/**
 * A monetary value with currency.
 *
 */
export type MoneyV2 = Simplify<{
	/** Decimal money amount. */
	amount: number;
	/** Currency of the money. */
	currencyCode: CurrencyCode;
}>;

/** The compare-at price range of the product. */
export type ProductCompareAtPriceRange = Simplify<{
	/** The highest variant's compare-at price. */
	maxVariantCompareAtPrice: MoneyV2;
	/** The lowest variant's compare-at price. */
	minVariantCompareAtPrice: MoneyV2;
}>;

/** Supported private metafield value types. */
export type PrivateMetafieldValueType =
	/** An integer metafield. */
	| 'INTEGER'
	/** A JSON string metafield. */
	| 'JSON_STRING'
	/** A string metafield. */
	| 'STRING';

/**
 * Private metafields represent custom metadata that is attached to a resource.
 * Private metafields are accessible only by the application that created them and only from the GraphQL Admin API.
 *
 * An application can create a maximum of 10 private metafields per shop resource.
 *
 * Private metafields are deprecated. Metafields created using a reserved namespace are private by default. See our guide for
 * [migrating private metafields](https://shopify.dev/docs/apps/custom-data/metafields/migrate-private-metafields).
 *
 */
export type PrivateMetafield = Simplify<{
	/** The date and time when the private metafield was created. */
	createdAt: Date;
	/** The ID of the private metafield. */
	id: string;
	/** The key name of the private metafield. */
	key: string;
	/** The namespace of the private metafield. */
	namespace: string;
	/** The date and time when the private metafield was updated. */
	updatedAt: Date;
	/** The value of a private metafield. */
	value: string;
	/** Represents the private metafield value type. */
	valueType: PrivateMetafieldValueType;
}>;

/**
 * Returns information about pagination in a connection, in accordance with the
 * [Relay specification](https://relay.dev/graphql/connections.htm#sec-undefined.PageInfo).
 * For more information, please read our [GraphQL Pagination Usage Guide](https://shopify.dev/api/usage/pagination-graphql).
 *
 */
export type PageInfo = {
	/** The cursor corresponding to the last node in edges. */
	endCursor?: string;
	/** Whether there are more pages to fetch following the current page. */
	hasNextPage: boolean;
	/** Whether there are any pages prior to the current page. */
	hasPreviousPage: boolean;
	/** The cursor corresponding to the first node in edges. */
	startCursor?: string;
};

/**
 * An auto-generated type which holds one PrivateMetafield and a cursor during pagination.
 *
 */
export type PrivateMetafieldEdge = Simplify<{
	/** A cursor for use in pagination. */
	cursor: string;
	/** The item at the end of PrivateMetafieldEdge. */
	node: PrivateMetafield;
}>;

/**
 * An auto-generated type for paginating through multiple PrivateMetafields.
 *
 */
export type PrivateMetafieldConnection = Simplify<{
	/** A list of edges. */
	edges: PrivateMetafieldEdge[];
	/** A list of the nodes contained in PrivateMetafieldEdge. */
	nodes: PrivateMetafield[];
	/** Information to aid in pagination. */
	pageInfo: PageInfo;
}>;

/** Represents an image resource. */
// TODO() It doesn't fit 100% to real Image object
export type Image = Simplify<{
	/** A word or phrase to share the nature or contents of an image. */
	altText?: string;
	/** The original height of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
	height?: number;
	/** A unique ID for the image. */
	id?: string;
	/**
	 * The location of the original image as a URL.
	 *
	 * If there are any existing transformations in the original source URL, they will remain and not be stripped.
	 *
	 * @deprecated Use `url` instead.
	 */
	originalSrc: string;
	/**
	 * Returns a private metafield by namespace and key that belongs to the resource.
	 * @deprecated Metafields created using a reserved namespace are private by default. See our guide for
	 * [migrating private metafields](https://shopify.dev/docs/apps/custom-data/metafields/migrate-private-metafields).
	 *
	 */
	// TODO() We must provide key, namespace to get metafield
	privateMetafield?: PrivateMetafield;
	/**
	 * List of private metafields that belong to the resource.
	 * @deprecated Metafields created using a reserved namespace are private by default. See our guide for
	 * [migrating private metafields](https://shopify.dev/docs/apps/custom-data/metafields/migrate-private-metafields).
	 *
	 */
	privateMetafields: PrivateMetafieldConnection;
	/**
	 * The location of the image as a URL.
	 * @deprecated Use `url` instead.
	 */
	src: string;
	/**
	 * The location of the transformed image as a URL.
	 *
	 * All transformation arguments are considered "best-effort". If they can be applied to an image, they will be.
	 * Otherwise any transformations which an image type doesn't support will be ignored.
	 *
	 * @deprecated Use `url(transform:)` instead
	 */
	transformedSrc: string;
	/**
	 * The location of the image as a URL.
	 *
	 * If no transform options are specified, then the original image will be preserved including any pre-applied transforms.
	 *
	 * All transformation options are considered "best-effort". Any transformation that the original image type doesn't support will be ignored.
	 *
	 * If you need multiple variations of the same image, then you can use [GraphQL aliases](https://graphql.org/learn/queries/#aliases).
	 *
	 */
	url: string;
	/** The original width of the image in pixels. Returns `null` if the image isn't hosted by Shopify. */
	width?: number;
}>;

/** The possible content types for a media object. */
export type MediaContentType =
	/** An externally hosted video. */
	| 'EXTERNAL_VIDEO'
	/** A Shopify-hosted image. */
	| 'IMAGE'
	/** A 3d model. */
	| 'MODEL_3D'
	/** A Shopify-hosted video. */
	| 'VIDEO';

/** Error types for media. */
export type MediaErrorCode =
	/** Media could not be created because a file with the same name already exists. */
	| 'DUPLICATE_FILENAME_ERROR'
	/** Media could not be created because embed permissions are disabled for this video. */
	| 'EXTERNAL_VIDEO_EMBED_DISABLED'
	/** Media could not be created because video is either not found or still transcoding. */
	| 'EXTERNAL_VIDEO_EMBED_NOT_FOUND_OR_TRANSCODING'
	/** Media could not be created because the external video has an invalid aspect ratio. */
	| 'EXTERNAL_VIDEO_INVALID_ASPECT_RATIO'
	/** Media could not be created because the external video could not be found. */
	| 'EXTERNAL_VIDEO_NOT_FOUND'
	/** Media could not be created because the external video is not listed or is private. */
	| 'EXTERNAL_VIDEO_UNLISTED'
	/** Media could not be created because the cumulative file storage limit would be exceeded. */
	| 'FILE_STORAGE_LIMIT_EXCEEDED'
	/** File could not be processed because the source could not be downloaded. */
	| 'GENERIC_FILE_DOWNLOAD_FAILURE'
	/** File could not be created because the size is too large. */
	| 'GENERIC_FILE_INVALID_SIZE'
	/** Media could not be processed because the image could not be downloaded. */
	| 'IMAGE_DOWNLOAD_FAILURE'
	/** Media could not be processed because the image could not be processed. */
	| 'IMAGE_PROCESSING_FAILURE'
	/** Media could not be created because the image has an invalid aspect ratio. */
	| 'INVALID_IMAGE_ASPECT_RATIO'
	/** Media could not be created because the image size is too large. */
	| 'INVALID_IMAGE_FILE_SIZE'
	/** Media could not be created because the image's resolution exceeds the max limit. */
	| 'INVALID_IMAGE_RESOLUTION'
	/** Media could not be processed because the signed URL was invalid. */
	| 'INVALID_SIGNED_URL'
	/** Media timed out because it is currently being modified by another operation. */
	| 'MEDIA_TIMEOUT_ERROR'
	/** Media could not be created because the model file failed processing. */
	| 'MODEL3D_GLB_OUTPUT_CREATION_ERROR'
	/** Media could not be created because the model can't be converted to USDZ format. */
	| 'MODEL3D_GLB_TO_USDZ_CONVERSION_ERROR'
	/** Media could not be created because the model file failed processing. */
	| 'MODEL3D_PROCESSING_FAILURE'
	/** Media could not be created because the model's thumbnail generation failed. */
	| 'MODEL3D_THUMBNAIL_GENERATION_ERROR'
	/** There was an issue while trying to generate a new thumbnail. */
	| 'MODEL3D_THUMBNAIL_REGENERATION_ERROR'
	/** Model failed validation. */
	| 'MODEL3D_VALIDATION_ERROR'
	/** Media error has occured for unknown reason. */
	| 'UNKNOWN'
	/** Media could not be created because the image is an unsupported file type. */
	| 'UNSUPPORTED_IMAGE_FILE_TYPE'
	/** Media could not be created because it has an invalid file type. */
	| 'VIDEO_INVALID_FILETYPE_ERROR'
	/** Media could not be created because it does not meet the maximum duration requirement. */
	| 'VIDEO_MAX_DURATION_ERROR'
	/** Media could not be created because it does not meet the maximum height requirement. */
	| 'VIDEO_MAX_HEIGHT_ERROR'
	/** Media could not be created because it does not meet the maximum width requirement. */
	| 'VIDEO_MAX_WIDTH_ERROR'
	/** Media could not be created because the metadata could not be read. */
	| 'VIDEO_METADATA_READ_ERROR'
	/** Media could not be created because it does not meet the minimum duration requirement. */
	| 'VIDEO_MIN_DURATION_ERROR'
	/** Media could not be created because it does not meet the minimum height requirement. */
	| 'VIDEO_MIN_HEIGHT_ERROR'
	/** Media could not be created because it does not meet the minimum width requirement. */
	| 'VIDEO_MIN_WIDTH_ERROR'
	/** Video failed validation. */
	| 'VIDEO_VALIDATION_ERROR';

/**
 * Represents a media error. This typically occurs when there is an issue with the media itself causing it to fail validation.
 * Check the media before attempting to upload again.
 *
 */
export type MediaError = Simplify<{
	/** Code representing the type of error. */
	code: MediaErrorCode;
	/** Additional details regarding the error. */
	details?: string;
	/** Translated error message. */
	message: string;
}>;

/**
 * Represents a media warning. This occurs when there is a non-blocking concern regarding your media.
 * Consider reviewing your media to ensure it is correct and its parameters are as expected.
 *
 */
export type MediaWarning = Simplify<{
	/** The code representing the type of warning. */
	code: MediaWarningCode;
	/** Translated warning message. */
	message?: string;
}>;

/** Warning types for media. */
export type MediaWarningCode =
	/** 3D model physical size might be invalid. The dimensions of your model are very large. Consider reviewing your model to ensure they are correct. */
	| 'MODEL_LARGE_PHYSICAL_SIZE'
	/** 3D model physical size might be invalid. The dimensions of your model are very small. Consider reviewing your model to ensure they are correct. */
	| 'MODEL_SMALL_PHYSICAL_SIZE';

/** Represents the preview image for a media. */
export type MediaPreviewImage = Simplify<{
	/** The preview image for the media. Returns `null` until `status` is `READY`. */
	image?: Image;
	/** Current status of the preview image. */
	status: MediaPreviewImageStatus;
}>;

/** The possible statuses for a media preview image. */
export type MediaPreviewImageStatus =
	/** Preview image processing has failed. */
	| 'FAILED'
	/** Preview image is being processed. */
	| 'PROCESSING'
	/** Preview image is ready to be displayed. */
	| 'READY'
	/** Preview image is uploaded but not yet processed. */
	| 'UPLOADED';

/** The possible statuses for a media object. */
export type MediaStatus =
	/** Media processing has failed. */
	| 'FAILED'
	/** Media is being processed. */
	| 'PROCESSING'
	/** Media is ready to be displayed. */
	| 'READY'
	/** Media has been uploaded but not yet processed. */
	| 'UPLOADED';

/** Represents a media interface. */
export type Media = Simplify<{
	/** A word or phrase to share the nature or contents of a media. */
	alt?: string;
	/** A globally-unique ID. */
	id: string;
	/** The media content type. */
	mediaContentType: MediaContentType;
	/** Any errors which have occurred on the media. */
	mediaErrors: MediaError[];
	/** The warnings attached to the media. */
	mediaWarnings: MediaWarning[];
	/** The preview image for the media. */
	preview?: MediaPreviewImage;
	/** Current status of the media. */
	status: MediaStatus;
}>;

/** A link to direct users to. */
export type Link = Simplify<{
	/** A context-sensitive label for the link. */
	label: string;
	/** The translations associated with the resource. */
	// TODO() if we need to get translations -> we must provide locale filter
	// translations: Translation[];
	/** The URL that the link visits. */
	url: string;
}>;

/** Represents an error in the input of a mutation. */
export type UserError = Simplify<{
	/** The path to the input field that caused the error. */
	field?: string[];
	/** The error message. */
	message: string;
}>;

/**
 * Reports the status of shops and their resources and displays this information
 * within Shopify admin. AppFeedback is used to notify merchants about steps they need to take
 * to set up an app on their store.
 *
 */
// TODO() It's not the same as in shopify models
export type AppFeedback = Simplify<{
	/** The application associated to the feedback. */
	// TODO() Do we need this?
	// app: App;
	/** A link to where merchants can resolve errors. */
	link?: Link;
	/** The feedback message presented to the merchant. */
	messages: UserError[];
}>;

/**
 * Represents feedback from apps about a resource, and the steps required to set up the apps on the shop.
 *
 */
export type ResourceFeedback = Simplify<{
	/**
	 * Feedback from an app about the steps a merchant needs to take to set up the app on their store.
	 * @deprecated Use `details` instead.
	 */
	appFeedback: AppFeedback[];
	/** List of AppFeedback detailing issues regarding a resource. */
	details: AppFeedback[];
	/** Summary of resource feedback pertaining to the resource. */
	summary: string;
}>;

/** The price range of the product. */
export type ProductPriceRangeV2 = Simplify<{
	/** The highest variant's price. */
	maxVariantPrice: MoneyV2;
	/** The lowest variant's price. */
	minVariantPrice: MoneyV2;
}>;

// TODO() It doesn't fit 100% to real return model from shopify
// https://shopify.dev/docs/api/admin-graphql/2024-10/queries/products?language=Node.js
export type InferSelectModel = Simplify<
	{
		/** A globally-unique ID. */
		id: string;
		/** The date and time ([ISO 8601 format](https://en.wikipedia.org/wiki/ISO_8601)) when the product was created. */
		createdAt: Date;
		/**
		 * The date and time when the product was last modified. A product's updatedAt value can change for different reasons.
		 * For example, if an order is placed for a product that has inventory tracking set up, then the inventory adjustment is counted as an update.
		 *
		 */
		updatedAt: Date;
		/** Whether the product is a gift card. */
		isGiftCard: boolean;
		category?: ProductTaxonomyCategory;
		/** The metafields to associate with this product. */
		metafields?: InferSelectMetafield[];
		/** A list of product options. The limit is specified by Shop.resourceLimits.maxProductOptions. */
		options: ProductOption[];
		/** The compare-at price range of the product in the default shop currency. */
		compareAtPriceRange?: ProductCompareAtPriceRange;
		/** A default cursor that returns the single next record, sorted ascending by ID. */
		defaultCursor: string;
		/** A stripped description of the product, single line with HTML tags removed. */
		description: string;
		/** The featured image for the product. Use featuredMedia instead. */
		featuredImage?: Image;
		/** The featured media for the product. */
		featuredMedia?: Media;
		/** The featured media for the product. */
		feedback?: ResourceFeedback;
		/** Whether the product has only a single variant with the default option and value. */
		hasOnlyDefaultVariant: boolean;
		/** Whether the product has out of stock variants. */
		hasOutOfStockVariants: boolean;
		/** Determines if at least one of the product variant requires components. The default value is false. */
		hasVariantsThatRequiresComponents: boolean;
		/** The ID of the corresponding resource in the REST Admin API. */
		legacyResourceId: number;
		/** The ID of the corresponding resource in the REST Admin API. */
		mediaCount?: ProductCount;
		/** The online store preview URL. */
		onlineStorePreviewUrl?: string;
		/** The online store URL for the product. A value of null indicates that the product isn't published to the Online Store sales channel. */
		onlineStoreUrl?: string;
		/** The price range of the product with prices formatted as decimals. */
		priceRangeV2: ProductPriceRangeV2;
		/** Count of selling plan groups associated with the product. */
		sellingPlanGroupsCount?: ProductCount;
		/** The quantity of inventory in stock. */
		totalInventory: number;
		/** Whether inventory tracking has been enabled for the product. */
		tracksInventory: boolean;
	} & ProductDefinitionConfig
>;

/** The input fields to claim ownership for Product features such as Bundles. */
export type ProductClaimOwnershipInput = Simplify<{
	/**
	 * Claiming ownership of bundles lets the app render a custom UI for the bundles' card on the
	 * products details page in the Shopify admin.
	 *
	 * Bundle ownership can only be claimed when creating the product. If you create `ProductVariantComponents`
	 * in any of its product variants, then the bundle ownership is automatically assigned to the app making the call.
	 *
	 * [Learn more](https://shopify.dev/docs/apps/selling-strategies/bundles/product-config).
	 *
	 */
	bundles?: boolean;
}>;

export type ExtractMetafieldNames<TMetafieldSchema extends Metafield> = TMetafieldSchema extends Metafield<infer TName>
	? TName
	: never;
export type InferUpdateModel<TMetafieldSchema extends Record<string, Metafield>> = Simplify<
	Partial<
		{
			/** The ID of the category associated with the product. */
			category?: string;
			/** Claim ownership of a product. */
			claimOwnership?: ProductClaimOwnershipInput;
			/** The IDs of the collections that this product will be added to. */
			collectionsToJoin?: string[];
			/** The IDs of collections that will no longer include the existing product. */
			collectionsToLeave?: string[];
			/** The custom product type specified by the merchant. */
			customProductType: string;
			/** Whether the product is a gift card. */
			giftCard: boolean;
			/** The metafields to associate with this product. */
			metafields: {
				[K in keyof TMetafieldSchema as ExtractMetafieldNames<TMetafieldSchema[K]>]?: string | Date | number;
			};
			/**
			 * List of custom product options and option values (maximum of 3 per product). Supported as input with the productCreate mutation only.
			 *
			 */
			productOptions: ProductOption[];
			/**
			 * Whether a redirect is required after a new handle has been provided.
			 * If true, then the old handle is redirected to the new one automatically.
			 *
			 */
			redirectNewHandle: boolean;
		} & ProductDefinitionConfig
	>
>;

export interface UpdateConfig<TMetafieldSchema extends Record<string, Metafield>> {
	fields: InferUpdateModel<TMetafieldSchema>;
}

export type ListConfigSelectFields<T extends InferSelectModel> = {
	[K in keyof T]?: boolean | 0 | 1;
};

export type ListConfigUpdateFields<T extends InferUpdateModel<any>> = {
	[K in keyof T]?: boolean | 0 | 1;
};

export type ListConfigQuery =
	// !!! TODO() Do we need to query just string? If so need to understand what field is default !!!
	// | string
	| {
			/** Text entered without a field constraint searches multiple aspects of the record. */
			default?: ListConfigQueryItem<string>;
			/**
			 * Filter query by the product variant barcode field.
			 * Example:
			 *  - ABC-abc-1234
			 */
			barcode?: ListConfigQueryItem<string>;
			bundles?: boolean; // пососу ТУТ ???
			/** Filter by the category ID of the product */
			categoryId?: ListConfigQueryItem<string>;
			/** Filter by The role of the product in a combined listing */
			combinedListingRole?: 'PARENT' | 'CHILD';
			/**
			 * Filter by the date and time when the product was created.
			 * Example:
			 *  - >'2020-10-21T23:39:20Z'
			 *  - <now
			 *
			 */
			createdAt?: ListConfigQueryItem<Date | string>;
			/** Filter query by delivery profile ID */
			deliveryProfileId?: ListConfigQueryItem<string>;
			// error_feedback ???
			/** Filter query by the product isGiftCard field. */
			giftCard?: boolean;
			/** Filter query a comma-separated list of handles. */
			handle?: ListConfigQueryItem<string>;
			/** Filter query by has_only_composites. */
			hasOnlyComposites?: boolean;
			/** Filter query by products that have only a default variant. */
			hasOnlyDefaultVariant?: boolean;
			/** Filter query by products which have variant(s) with components. */
			hasVariantWithComponents?: boolean;
			/** Filter by id range. */
			id?: ListConfigQueryItem<string>;
			/**
			 * Filter query by inventory count.
			 * Example:
			 *  - 0
			 *  - >150
			 *
			 */
			inventoryTotal?: ListConfigQueryItem<number>;
			/** Filter query by products that have a reduced price. See the [CollectionRule](https://shopify.dev/api/admin-graphql/latest/enums/CollectionRuleColumn) for more information. */
			isPriceReduced?: boolean;
			/** Filter query by products that are out of stock in at least one location. */
			outOfStockSomewhere?: boolean;
			/**
			 * Filter query by the product variants price field.
			 * Example:
			 *  - 100.57
			 */
			price?: ListConfigQueryItem<number>; // decimal
			/**
			 * Filter by the app ID that claims ownership of a product configuration.
			 * Example:
			 *  - 10001
			 */
			productConfigurationOwner?: ListConfigQueryItem<string>;
			// TODO() need to made it as function with channel APP ID prefix before status to filter
			// productPublicationStatus?: 'APPROVED' | 'REJECTED' | 'NEEDS_ACTION' | 'AWAITING_REVIEW' | 'PUBLISHED' | 'DEMOTED' | 'SCHEDULED' | 'provisionally_PUBLISHED';
			/** Filter query by a comma-separated list of product types */
			productType?: ListConfigQueryItem<string>;
			publishableStatus?:
				| 'ONLINE_STORE_CHANNEL'
				| 'PUBLISHED'
				| 'UNPUBLISHED'
				| 'VISIBLE'
				| 'UNAVAILABLE'
				| 'HIDDEN'
				| 'INTENDED'
				| 'VISIBLE';
			/** Filter by the date and time when the product was published to the Online Store. */
			publishedAt?: ListConfigQueryItem<Date | string>;
			publishedStatus?: 'UNSET' | 'PENDING' | 'APPROVED' | 'NOT APPROVED';
			/** Filter query by the product variants sku field. */
			sku?: ListConfigQueryItem<string>;
			/** Filter query by a comma-separated list of statuses. */
			status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
			/**
			 * Filter query by tag field.
			 * Example:
			 *  - my_tag
			 *  - <my_tag2
			 *
			 */
			tag?: string;
			/**
			 * Filter query by objects that don’t have the specified tag.
			 * Example:
			 *  - my_tag
			 *  - <my_tag2
			 *
			 */
			tagNot?: string;
			/** Filter query by the product title field. */
			title?: ListConfigQueryItem<string>;
			/**
			 * Filter by the date and time when the product was last updated.
			 * Example:
			 *  - >'2020-10-21T23:39:20Z'
			 *  - <now
			 *
			 */
			updatedAt?: ListConfigQueryItem<Date | string>;
			/** Filter query by a comma-separated list of vendors. */
			vendor?: ListConfigQueryItem<string>;
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

export type SortKey =
	/** Sort by the created_at value. */
	| 'created_at'
	/** Sort by the id value. */
	| 'id'
	/** Sort by the inventory_total value. */
	| 'inventory_total'
	/** Sort by the product_type value. */
	| 'product_type'
	/** Sort by the published_at value. */
	| 'published_at'
	/**
	 * Sort by relevance to the search terms when the query parameter is specified on the connection.
	 * Don't use this sort key when no search query is specified. Pagination isn't supported when using this sort key.
	 *
	 * */
	| 'relevance'
	/** Sort by the title value. */
	| 'title'
	/** Sort by the updated_at value. */
	| 'updated_at'
	/** Sort by the vendor value. */
	| 'vendor';

export interface ListConfig {
	fields?: ListConfigSelectFields<InferSelectModel>;
	query?: ListConfigQuery;
	after?: string;
	before?: string;
	first?: number; // or last required
	last?: number; // or first required
	reverse?: boolean;
	sortKey?: SortKey;
	savedSearchId?: string;
}

export type ProductTaxonomyCategory = Simplify<{
	/** The full name of the product taxonomy node. For example,  Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Beds. */
	fullName: string;
	/** The ID of the product taxonomy node. */
	id: string;
	/** Whether the node is a leaf node. */
	isLeaf: boolean;
	/** Whether the node is a root node. */
	isRoot: boolean;
	/** The name of the product taxonomy node. For example, Dog Beds. */
	name: string;
	/** The IDs of the category's ancestor categories. */
	ancestorIds: number[];
	/** The IDs of the category's child categories. */
	childrenIds: number[];
	/** Whether the category is archived. The default value is false. */
	isArchived: boolean;
	/**
	 * The level of the category in the taxonomy tree. Levels indicate the depth of the category from the root.
	 * For example, in Animals & Pet Supplies > Pet Supplies > Dog Supplies, Animals & Pet Supplies is at level 1, Animals & Pet Supplies > Pet Supplies is at level 2, and Animals & Pet Supplies > Pet Supplies > Dog Supplies is at level 3.
	 *
	 */
	level: number;
	/** The ID of the category's parent category. */
	parentId?: number;
}>;

export type CombinedListingsRole = 'CHILD' | 'PARENT';

/** The count's precision, or how exact the value is. */
export type CountPrecision = 'AT_LEAST' | 'EXACT';
export type ProductCount = Simplify<{
	/** The count of elements. */
	count: number;
	/** The count's precision, or how exact the value is. */
	precision: CountPrecision;
}>;

/** The possible product statuses. */
export type ProductStatus =
	/** The product is ready to sell and can be published to sales channels and apps. Products with an active status aren't automatically published to sales channels, such as the online store, or apps. By default, existing products are set to active. */
	| 'ACTIVE'
	/** The product is no longer being sold and isn't available to customers on sales channels and apps. */
	| 'ARCHIVED'
	/** The product isn't ready to sell and is unavailable to customers on sales channels and apps. By default, duplicated and unarchived products are set to draft. */
	| 'DRAFT';

/** SEO information. */
export type Seo = Simplify<{
	/** SEO Description. */
	description?: string;
	/** SEO Title. */
	title?: string;
}>;

export type ProductDefinitionConfig = {
	/** The role of the product in a combined listing. If null, the product not a part of any combined_listing. */
	combinedListingRole?: CombinedListingsRole;
	/** The product type specified by the merchant. */
	productType: string;
	/** The description of the product, complete with HTML formatting. */
	descriptionHtml: string;
	/** The theme template used when viewing the gift card in a store. */
	giftCardTemplateSuffix?: string;
	/** A unique human-friendly string of the product's title. */
	handle: string;
	/**
	 * Whether the product can only be purchased with a selling plan (subscription).
	 * Products that are sold on subscription (requiresSellingPlan: true) can be updated only for online stores.
	 * If you update a product to be subscription only, then the product is unpublished from all channels except the online store.
	 *
	 */
	requiresSellingPlan: boolean;
	/** SEO information of the product. */
	seo: Seo;
	/** The product status. This controls visibility across all channels. */
	status: ProductStatus;
	/**
	 * A comma separated list of tags associated with the product.
	 * Updating tags overwrites any existing tags that were previously added to the product.
	 * To add new tags without overwriting existing tags, use the [tagsAdd](https://shopify.dev/api/admin-graphql/latest/mutations/tagsadd) mutation.
	 *
	 */
	tags: string[];
	/** The theme template used when viewing the product in a store. */
	templateSuffix?: string;
	/** The title of the product. */
	title: string;
	/** The name of the product's vendor. */
	vendor: string;
};

export type ResultItem<TFields extends ListConfigSelectFields<InferSelectModel> | Metafield | undefined = undefined> =
	TFields extends undefined
		? Simplify<InferSelectModel>
		: TFields[keyof TFields] extends false
		  ? {
					[K in Exclude<keyof InferSelectModel, keyof TFields>]: InferSelectModel[K];
			  }
		  : Simplify<{
					[K in keyof TFields as TFields[K] extends true ? K : never]: TFields[K] extends Metafield
						? Simplify<InferSelectModel['metafields']>
						: K extends keyof InferSelectModel
						  ? Simplify<InferSelectModel[K]>
						  : never;
			  }>;

export type UpdateResultItem<TFields extends ListConfigUpdateFields<InferUpdateModel<any>>> = Simplify<{
	[K in keyof TFields]-?: K extends 'metafields'
		? InferUpdatedMetafield[]
		: K extends keyof InferUpdateModel<any>
		  ? InferUpdateModel<any>[K]
		  : never;
}>;

export type ListResult<TFields extends ListConfigSelectFields<InferSelectModel> | Metafield | undefined> = Simplify<{
	items: ResultItem<TFields>[];
	pageInfo: {
		startCursor: string;
		endCursor: string;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};
}>;

export type SelectedFields = Record<string, keyof Omit<InferSelectModel, 'metafield'> | Metafield>;
