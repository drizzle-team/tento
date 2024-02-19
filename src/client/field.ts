import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import type {
	MetaobjectFieldDefinitionBuilder,
	MetaobjectFieldDefinitionConfig,
	MetaobjectFieldDefinitionConfigWithType,
} from './types';
import { allowedDomains, choices, fileTypes, max, maxPrecision, min, regex, type Validations } from './validations';

dayjs.extend(utc);

export abstract class Field<T> {
	declare readonly _: {
		readonly type: T;
		readonly config: MetaobjectFieldDefinitionBuilder;
	};

	constructor(config: MetaobjectFieldDefinitionConfigWithType<any>, validations: Validations) {
		this._ = {
			config: buildMetaobjectFieldDefinition(config, validations),
			type: undefined as T,
		};
	}

	static toAPIValue(value: any): any {
		return value;
	}

	toAPIValue(value: T): any {
		return (this.constructor as typeof Field).toAPIValue(value);
	}

	static fromAPIValue(value: any): any {
		return value;
	}

	fromAPIValue(value: any): T {
		return (this.constructor as typeof Field).fromAPIValue(value);
	}
}

export function buildMetaobjectFieldDefinition(
	config: MetaobjectFieldDefinitionConfigWithType<any>,
	validations: Validations,
): MetaobjectFieldDefinitionBuilder {
	return {
		...config,
		validations: config.validations?.(validations),
	};
}

export const fields = {
	singleLineTextField,
	multiLineTextField,
	url,
	integer,
	decimal,
	decimalList,
	date,
	dateList,
	dateTime,
	// product,
	// productList,
	// file,
	// fileList,
	dimension,
	dimensionList,
	json,
	volume,
	volumeList,
	weight,
	weightList,
};

export type Fields = typeof fields;

export class JsonField extends Field<string> {
	constructor(config: MetaobjectFieldDefinitionConfig<JsonFieldValidations>, validations: Validations) {
		super({ ...config, type: 'json' }, validations);
	}
}

export function json<T extends MetaobjectFieldDefinitionConfig<JsonFieldValidations>>(
	config?: T,
): JsonField {
	return new JsonField(config ?? {}, jsonFieldValidations);
}

export const jsonFieldValidations = {
};

export type JsonFieldValidations = typeof singleLineTextFieldValidations;

export class SingleLineTextField extends Field<string> {
	constructor(config: MetaobjectFieldDefinitionConfig<SingleLineTextFieldValidations>, validations: Validations) {
		super({ ...config, type: 'single_line_text_field' }, validations);
	}
}

export function singleLineTextField<T extends MetaobjectFieldDefinitionConfig<SingleLineTextFieldValidations>>(
	config?: T,
): SingleLineTextField {
	return new SingleLineTextField(config ?? {}, singleLineTextFieldValidations);
}

export const singleLineTextFieldValidations = {
	min(value: number) {
		return min(value.toString());
	},
	max(value: number) {
		return max(value.toString());
	},
	regex,
	choices,
};

export type SingleLineTextFieldValidations = typeof singleLineTextFieldValidations;

export class SingleLineTextListField extends Field<string[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<SingleLineTextListFieldValidations>, validations: Validations) {
		super({ ...config, type: 'list.single_line_text_field' }, validations);
	}
}

export function singleLineTextList<T extends MetaobjectFieldDefinitionConfig<SingleLineTextListFieldValidations>>(
	config?: T,
): SingleLineTextListField {
	return new SingleLineTextListField(config ?? {}, singleLineTextListFieldValidations);
}

export const singleLineTextListFieldValidations = singleLineTextFieldValidations;

export type SingleLineTextListFieldValidations = typeof singleLineTextListFieldValidations;

export class MultiLineTextField extends Field<string> {
	constructor(config: MetaobjectFieldDefinitionConfig<MultiLineTextFieldValidations>, validations: Validations) {
		super({ ...config, type: 'multi_line_text_field' }, validations);
	}
}

export function multiLineTextField<T extends MetaobjectFieldDefinitionConfig<MultiLineTextFieldValidations>>(
	config?: T,
): MultiLineTextField {
	return new MultiLineTextField(config ?? {}, multiLineTextFieldValidations);
}

export const multiLineTextFieldValidations = {
	min(value: number) {
		return min(value.toString());
	},
	max(value: number) {
		return max(value.toString());
	},
	regex,
};

export type MultiLineTextFieldValidations = typeof multiLineTextFieldValidations;

export class DecimalField extends Field<number> {
	constructor(config: MetaobjectFieldDefinitionConfig<DecimalFieldValidations>, validations: Validations) {
		super({ ...config, type: 'number_decimal' }, validations);
	}

	static override toAPIValue(value: number): string {
		const str = value.toString();
		if (str.includes('.')) {
			return str;
		}
		return `${str}.0`;
	}

	static override fromAPIValue(value: string): number {
		return Number(value);
	}
}

export function decimal<T extends MetaobjectFieldDefinitionConfig<DecimalFieldValidations>>(config?: T): DecimalField {
	return new DecimalField(config ?? {}, decimalFieldValidations);
}

export const decimalFieldValidations = {
	min(value: number) {
		return min(DecimalField.toAPIValue(value));
	},
	max(value: number) {
		return max(DecimalField.toAPIValue(value));
	},
	maxPrecision,
};

export type DecimalFieldValidations = typeof decimalFieldValidations;

export class DecimalListField extends Field<number[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<DecimalListFieldValidations>, validations: Validations) {
		super({ ...config, type: 'list.number_decimal' }, validations);
	}

	static override toAPIValue(value: number[]): string {
		return JSON.stringify(value.map((v) => DecimalField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): number[] {
		return JSON.parse(value).map((v: string) => DecimalField.fromAPIValue(v));
	}
}

export function decimalList<T extends MetaobjectFieldDefinitionConfig<DecimalListFieldValidations>>(
	config?: T,
): DecimalListField {
	return new DecimalListField(config ?? {}, decimalListFieldValidations);
}

export const decimalListFieldValidations = decimalFieldValidations;

export type DecimalListFieldValidations = typeof decimalListFieldValidations;

export class UrlField extends Field<string> {
	constructor(config: MetaobjectFieldDefinitionConfig<UrlValidations>, validations: Validations) {
		super({ ...config, type: 'url' }, validations);
	}
}

export function url<T extends MetaobjectFieldDefinitionConfig<UrlValidations>>(config?: T): UrlField {
	return new UrlField(config ?? {}, urlValidations);
}

export const urlValidations = {
	allowedDomains,
};

export type UrlValidations = typeof urlValidations;

export class UrlListField extends Field<string[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<UrlListValidations>, validations: Validations) {
		super({ ...config, type: 'list.url' }, validations);
	}
}

export function urlList<T extends MetaobjectFieldDefinitionConfig<UrlListValidations>>(config?: T): UrlListField {
	return new UrlListField(config ?? {}, urlListValidations);
}

export const urlListValidations = urlValidations;

export type UrlListValidations = typeof urlListValidations;

export class IntegerField extends Field<number> {
	constructor(config: MetaobjectFieldDefinitionConfig<IntegerValidations>, validations: Validations) {
		super({ ...config, type: 'number_integer' }, validations);
	}

	static override toAPIValue(value: number): string {
		return value.toString();
	}

	static override fromAPIValue(value: string): number {
		return Number(value);
	}
}

export function integer<T extends MetaobjectFieldDefinitionConfig<IntegerValidations>>(config?: T): IntegerField {
	return new IntegerField(config ?? {}, integerValidations);
}

export const integerValidations = {
	min(value: number) {
		return min(value.toString());
	},
	max(value: number) {
		return max(value.toString());
	},
};

export type IntegerValidations = typeof integerValidations;

export class IntegerListField extends Field<number[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<IntegerListValidations>, validations: Validations) {
		super({ ...config, type: 'list.number_integer' }, validations);
	}

	static override toAPIValue(value: number[]): string {
		return JSON.stringify(value.map((v) => IntegerField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): number[] {
		return JSON.parse(value).map((v: string) => IntegerField.fromAPIValue(v));
	}
}

export function integerList<T extends MetaobjectFieldDefinitionConfig<IntegerListValidations>>(
	config?: T,
): IntegerListField {
	return new IntegerListField(config ?? {}, integerListValidations);
}

export const integerListValidations = integerValidations;

export type IntegerListValidations = typeof integerListValidations;

export class DateField extends Field<Date> {
	constructor(config: MetaobjectFieldDefinitionConfig<DateValidations>, validations: Validations) {
		super({ ...config, type: 'date' }, validations);
	}

	static override toAPIValue(value: Date): string {
		return dayjs(value).utc().format('YYYY-MM-DD');
	}

	static override fromAPIValue(value: string): Date {
		return new Date(value);
	}
}

export function date<T extends MetaobjectFieldDefinitionConfig<DateValidations>>(config?: T): DateField {
	return new DateField(config ?? {}, dateValidations);
}

export const dateValidations = {
	min(value: Date | string) {
		return min(typeof value === 'string' ? value : DateField.toAPIValue(value));
	},
	max(value: Date | string) {
		return max(typeof value === 'string' ? value : DateField.toAPIValue(value));
	},
};

export type DateValidations = typeof dateValidations;

export class DateListField extends Field<Date[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<DateListValidations>, validations: Validations) {
		super({ ...config, type: 'list.date' }, validations);
	}

	static override toAPIValue(value: Date[]): string {
		return JSON.stringify(value.map((v) => DateField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): Date[] {
		return JSON.parse(value).map((v: string) => DateField.fromAPIValue(v));
	}
}

export function dateList<T extends MetaobjectFieldDefinitionConfig<DateListValidations>>(config?: T): DateListField {
	return new DateListField(config ?? {}, dateListValidations);
}

export const dateListValidations = dateValidations;

export type DateListValidations = typeof dateListValidations;

export class DateTimeField extends Field<Date> {
	constructor(config: MetaobjectFieldDefinitionConfig<DateTimeValidations>, validations: Validations) {
		super({ ...config, type: 'date_time' }, validations);
	}

	static override toAPIValue(value: Date): string {
		return dayjs(value).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
	}

	static override fromAPIValue(value: string): Date {
		return new Date(value);
	}
}

export function dateTime<T extends MetaobjectFieldDefinitionConfig<DateTimeValidations>>(config?: T): DateTimeField {
	return new DateTimeField(config ?? {}, dateTimeValidations);
}

export const dateTimeValidations = {
	min(value: Date | string) {
		return min(typeof value === 'string' ? value : DateTimeField.toAPIValue(value));
	},
	max(value: Date | string) {
		return max(typeof value === 'string' ? value : DateTimeField.toAPIValue(value));
	},
};

export type DateTimeValidations = typeof dateTimeValidations;

export class DateTimeListField extends Field<Date[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<DateTimeListValidations>, validations: Validations) {
		super({ ...config, type: 'list.date_time' }, validations);
	}

	static override toAPIValue(value: Date[]): string {
		return JSON.stringify(value.map((v) => DateTimeField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): Date[] {
		return JSON.parse(value).map((v: string) => DateTimeField.fromAPIValue(v));
	}
}

export function dateTimeList<T extends MetaobjectFieldDefinitionConfig<DateTimeListValidations>>(
	config?: T,
): DateTimeListField {
	return new DateTimeListField(config ?? {}, dateTimeListValidations);
}

export const dateTimeListValidations = dateTimeValidations;

export type DateTimeListValidations = typeof dateTimeListValidations;

export class ProductField<T> extends Field<T> {
	constructor(config: MetaobjectFieldDefinitionConfig, validations: Validations) {
		super({ ...config, type: 'product_reference' }, validations);
	}

	static override toAPIValue(value: any): string {
		return JSON.stringify(value);
	}

	static override fromAPIValue(value: string): any {
		return JSON.parse(value);
	}
}

export function product<T extends MetaobjectFieldDefinitionConfig>(config?: T): ProductField<T> {
	return new ProductField(config ?? {}, {});
}

export const productValidations = {};

export type ProductValidations = typeof productValidations;

export class ProductListField<T> extends Field<T[]> {
	constructor(config: MetaobjectFieldDefinitionConfig, validations: Validations) {
		super({ ...config, type: 'list.product_reference' }, validations);
	}

	static override toAPIValue(value: any): string {
		return JSON.stringify(value);
	}

	static override fromAPIValue(value: string): any {
		return JSON.parse(value);
	}
}

export function productList<T extends MetaobjectFieldDefinitionConfig>(config?: T): ProductListField<T> {
	return new ProductListField(config ?? {}, {});
}

export const productListValidations = productValidations;

export type ProductListValidations = typeof productListValidations;

export class FileField extends Field<Blob> {
	constructor(config: MetaobjectFieldDefinitionConfig<FileValidations>, validations: Validations) {
		super({ ...config, type: 'file_reference' }, validations);
	}
}

export function file<T extends MetaobjectFieldDefinitionConfig<FileValidations>>(config?: T): FileField {
	return new FileField(config ?? {}, fileValidations);
}

export const fileValidations = {
	fileTypes,
};

export type FileValidations = typeof fileValidations;

export class FileListField extends Field<Blob[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<FileListValidations>, validations: Validations) {
		super({ ...config, type: 'list.file_reference' }, validations);
	}
}

export function fileList<T extends MetaobjectFieldDefinitionConfig<FileListValidations>>(config?: T): FileListField {
	return new FileListField(config ?? {}, fileListValidations);
}

export const fileListValidations = fileValidations;

export type FileListValidations = typeof fileListValidations;

export type DimensionUnit = 'METERS' | 'CENTIMETERS' | 'MILLIMETERS' | 'INCHES' | 'FEET' | 'YARDS';

export interface DimensionFieldValue {
	value: number;
	unit: DimensionUnit | Omit<string, DimensionUnit>;
}

export class DimensionField extends Field<DimensionFieldValue> {
	constructor(config: MetaobjectFieldDefinitionConfig<DimensionValidations>, validations: Validations) {
		super({ ...config, type: 'dimension' }, validations);
	}

	static override toAPIValue(value: DimensionFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): DimensionFieldValue {
		return JSON.parse(value);
	}
}

export function dimension<T extends MetaobjectFieldDefinitionConfig<DimensionValidations>>(config?: T): DimensionField {
	return new DimensionField(config ?? {}, dimensionValidations);
}

export const dimensionValidations = {
	min(value: DimensionFieldValue) {
		return min(DimensionField.toAPIValue(value));
	},

	max(value: DimensionFieldValue) {
		return max(DimensionField.toAPIValue(value));
	},
};

export type DimensionValidations = typeof dimensionValidations;

export class DimensionListField extends Field<DimensionFieldValue[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<DimensionListValidations>, validations: Validations) {
		super({ ...config, type: 'list.dimension' }, validations);
	}

	static override toAPIValue(value: DimensionFieldValue[]): string {
		return JSON.stringify(value.map((v) => DimensionField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): DimensionFieldValue[] {
		return JSON.parse(value).map((v: string) => DimensionField.fromAPIValue(v));
	}
}

export function dimensionList<T extends MetaobjectFieldDefinitionConfig<DimensionListValidations>>(
	config?: T,
): DimensionListField {
	return new DimensionListField(config ?? {}, dimensionListValidations);
}

export const dimensionListValidations = dimensionValidations;

export type DimensionListValidations = typeof dimensionListValidations;

export type VolumeUnit =
	| 'MILLILITERS'
	| 'CENTILITERS'
	| 'LITERS'
	| 'PINTS'
	| 'CUBIC_INCHES'
	| 'CUBIC_FEET'
	| 'CUBIC_METERS'
	| 'IMPERIAL_FLUID_OUNCES';

export interface VolumeFieldValue {
	value: number;
	unit: VolumeUnit | Omit<string, VolumeUnit>;
}

export class VolumeField extends Field<VolumeFieldValue> {
	constructor(config: MetaobjectFieldDefinitionConfig<VolumeValidations>, validations: Validations) {
		super({ ...config, type: 'volume' }, validations);
	}

	static override toAPIValue(value: VolumeFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): VolumeFieldValue {
		return JSON.parse(value);
	}
}

export function volume<T extends MetaobjectFieldDefinitionConfig<VolumeValidations>>(config?: T): VolumeField {
	return new VolumeField(config ?? {}, volumeValidations);
}

export const volumeValidations = {
	min(value: VolumeFieldValue) {
		return min(VolumeField.toAPIValue(value));
	},

	max(value: VolumeFieldValue) {
		return max(VolumeField.toAPIValue(value));
	},
};

export type VolumeValidations = typeof volumeValidations;

export class VolumeListField extends Field<VolumeFieldValue[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<VolumeListValidations>, validations: Validations) {
		super({ ...config, type: 'list.volume' }, validations);
	}

	static override toAPIValue(value: VolumeFieldValue[]): string {
		return JSON.stringify(value.map((v) => VolumeField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): VolumeFieldValue[] {
		return JSON.parse(value).map((v: string) => VolumeField.fromAPIValue(v));
	}
}

export function volumeList<T extends MetaobjectFieldDefinitionConfig<VolumeListValidations>>(
	config?: T,
): VolumeListField {
	return new VolumeListField(config ?? {}, volumeListValidations);
}

export const volumeListValidations = volumeValidations;

export type VolumeListValidations = typeof volumeListValidations;

export type WeightUnit = 'KILOGRAMS' | 'GRAMS' | 'POUNDS' | 'OUNCES';

export interface WeightFieldValue {
	value: number;
	unit: WeightUnit | Omit<string, WeightUnit>;
}

export class WeightField extends Field<WeightFieldValue> {
	constructor(config: MetaobjectFieldDefinitionConfig<WeightValidations>, validations: Validations) {
		super({ ...config, type: 'weight' }, validations);
	}

	static override toAPIValue(value: WeightFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): WeightFieldValue {
		return JSON.parse(value);
	}
}

export function weight<T extends MetaobjectFieldDefinitionConfig<WeightValidations>>(config?: T): WeightField {
	return new WeightField(config ?? {}, weightValidations);
}

export const weightValidations = {
	min(value: WeightFieldValue) {
		return min(WeightField.toAPIValue(value));
	},

	max(value: WeightFieldValue) {
		return max(WeightField.toAPIValue(value));
	},
};

export type WeightValidations = typeof weightValidations;

export class WeightListField extends Field<WeightFieldValue[]> {
	constructor(config: MetaobjectFieldDefinitionConfig<WeightListValidations>, validations: Validations) {
		super({ ...config, type: 'list.weight' }, validations);
	}

	static override toAPIValue(value: WeightFieldValue[]): string {
		return JSON.stringify(value.map((v) => WeightField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): WeightFieldValue[] {
		return JSON.parse(value).map((v: string) => WeightField.fromAPIValue(v));
	}
}

export function weightList<T extends MetaobjectFieldDefinitionConfig<WeightListValidations>>(
	config?: T,
): WeightListField {
	return new WeightListField(config ?? {}, weightListValidations);
}

export const weightListValidations = weightValidations;

export type WeightListValidations = typeof weightListValidations;
