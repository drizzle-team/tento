import { MetafieldDefinitionValidationInput } from './types';

export type Validations = Record<string, (...args: any[]) => MetafieldDefinitionValidationInput>;

export function min(value: string): MetafieldDefinitionValidationInput {
	return { name: 'min', value };
}

export function max(value: string): MetafieldDefinitionValidationInput {
	return { name: 'max', value };
}

export function maxPrecision(value: number): MetafieldDefinitionValidationInput {
	return { name: 'max_precision', value: value.toString() };
}

export function regex(value: RegExp | string): MetafieldDefinitionValidationInput {
	return { name: 'regex', value: typeof value === 'string' ? value : value.source };
}

export function allowedDomains(domains: string[]): MetafieldDefinitionValidationInput {
	return { name: 'allowed_domains', value: JSON.stringify(domains) };
}

export function fileTypes(types: { images?: boolean; videos?: boolean }): MetafieldDefinitionValidationInput {
	if (!types.images && !types.videos) {
		throw new Error('At least one file type must be enabled');
	}
	const values: string[] = [];
	if (types.images) {
		values.push('Image');
	}
	if (types.videos) {
		values.push('Video');
	}
	return { name: 'file_type_options', value: JSON.stringify(values) };
}

export function choices(values: string[]): MetafieldDefinitionValidationInput {
	return { name: 'choices', value: JSON.stringify(values) };
}

export function metaobjectDefinition(value: string): MetafieldDefinitionValidationInput {
	return { name: 'metaobject_definition_id', value };
}
