import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import {
	allowedDomains,
	choices,
	fileTypes,
	max,
	maxPrecision,
	metaobjectDefinition,
	min,
	regex,
	type Validations,
} from '../validations';
import {
	MetafieldFieldDefinitionBuilder,
	MetafieldFieldDefinitionConfig,
	MetafieldFieldDefinitionConfigWithType,
} from './types';

dayjs.extend(utc);

export abstract class Field<T> {
	declare readonly _: {
		readonly type: T;
		readonly config: MetafieldFieldDefinitionBuilder;
	};

	constructor(config: MetafieldFieldDefinitionConfigWithType<any>, validations?: Validations) {
		this._ = {
			config: buildMetafieldFieldDefinitionConfig(config, validations),
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

export function buildMetafieldFieldDefinitionConfig(
	config: MetafieldFieldDefinitionConfigWithType<any>,
	validations?: Validations,
): MetafieldFieldDefinitionBuilder {
	return {
		...config,
		validations: config.validations?.(validations) as any,
	};
}

export const fields = {
	singleLineTextField,
	singleLineTextList,
	multiLineTextField,
	url,
	urlList,
	integer,
	integerList,
	decimal,
	decimalList,
	date,
	dateList,
	dateTime,
	dateTimeList,
	dimension,
	dimensionList,
	volume,
	volumeList,
	weight,
	weightList,
	metaobjectReference,
	// file,
	// fileList,
};

export type Fields = typeof fields;

export class SingleLineTextField extends Field<string> {
	constructor(config: MetafieldFieldDefinitionConfig<SingleLineTextFieldValidations>, validations: Validations) {
		super({ ...config, type: 'single_line_text_field' }, validations);
	}
}

export function singleLineTextField<T extends MetafieldFieldDefinitionConfig<SingleLineTextFieldValidations>>(
	config?: T,
): SingleLineTextField {
	return new SingleLineTextField((config as any) ?? {}, singleLineTextFieldValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.single_line_text_field' });
	}
}

export function singleLineTextList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): SingleLineTextListField {
	return new SingleLineTextListField((config as any) ?? {});
}

export class MultiLineTextField extends Field<string> {
	constructor(config: MetafieldFieldDefinitionConfig<MultiLineTextFieldValidations>, validations: Validations) {
		super({ ...config, type: 'multi_line_text_field' }, validations);
	}
}

export function multiLineTextField<T extends MetafieldFieldDefinitionConfig<MultiLineTextFieldValidations>>(
	config?: T,
): MultiLineTextField {
	return new MultiLineTextField((config as any) ?? {}, multiLineTextFieldValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<DecimalFieldValidations>, validations: Validations) {
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

export function decimal<T extends MetafieldFieldDefinitionConfig<DecimalFieldValidations>>(config?: T): DecimalField {
	return new DecimalField((config as any) ?? {}, decimalFieldValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.number_decimal' });
	}

	static override toAPIValue(value: number[]): string {
		return JSON.stringify(value.map((v) => DecimalField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): number[] {
		return JSON.parse(value).map((v: string) => DecimalField.fromAPIValue(v));
	}
}

export function decimalList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): DecimalListField {
	return new DecimalListField((config as any) ?? {});
}

export class UrlField extends Field<string> {
	constructor(config: MetafieldFieldDefinitionConfig<UrlValidations>, validations: Validations) {
		super({ ...config, type: 'url' }, validations);
	}
}

export function url<T extends MetafieldFieldDefinitionConfig<UrlValidations>>(config?: T): UrlField {
	return new UrlField((config as any) ?? {}, urlValidations);
}

export const urlValidations = {
	allowedDomains,
};

export type UrlValidations = typeof urlValidations;

export class UrlListField extends Field<string[]> {
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.url' });
	}
}

export function urlList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): UrlListField {
	return new UrlListField((config as any) ?? {});
}

export class IntegerField extends Field<number> {
	constructor(config: MetafieldFieldDefinitionConfig<IntegerValidations>, validations: Validations) {
		super({ ...config, type: 'number_integer' }, validations);
	}

	static override toAPIValue(value: number): string {
		return value.toString();
	}

	static override fromAPIValue(value: string): number {
		return Number(value);
	}
}

export function integer<T extends MetafieldFieldDefinitionConfig<IntegerValidations>>(config?: T): IntegerField {
	return new IntegerField((config as any) ?? {}, integerValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.number_integer' });
	}

	static override toAPIValue(value: number[]): string {
		return JSON.stringify(value.map((v) => IntegerField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): number[] {
		return JSON.parse(value).map((v: string) => IntegerField.fromAPIValue(v));
	}
}

export function integerList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): IntegerListField {
	return new IntegerListField((config as any) ?? {});
}

export class DateField extends Field<Date> {
	constructor(config: MetafieldFieldDefinitionConfig<DateValidations>, validations: Validations) {
		super({ ...config, type: 'date' }, validations);
	}

	static override toAPIValue(value: Date): string {
		return dayjs(value).utc().format('YYYY-MM-DD');
	}

	static override fromAPIValue(value: string): Date {
		return new Date(value);
	}
}

export function date<T extends MetafieldFieldDefinitionConfig<DateValidations>>(config?: T): DateField {
	return new DateField((config as any) ?? {}, dateValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.date' });
	}

	static override toAPIValue(value: Date[]): string {
		return JSON.stringify(value.map((v) => DateField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): Date[] {
		return JSON.parse(value).map((v: string) => DateField.fromAPIValue(v));
	}
}

export function dateList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): DateListField {
	return new DateListField((config as any) ?? {});
}

export class DateTimeField extends Field<Date> {
	constructor(config: MetafieldFieldDefinitionConfig<DateTimeValidations>, validations: Validations) {
		super({ ...config, type: 'date_time' }, validations);
	}

	static override toAPIValue(value: Date): string {
		return dayjs(value).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
	}

	static override fromAPIValue(value: string): Date {
		return new Date(value);
	}
}

export function dateTime<T extends MetafieldFieldDefinitionConfig<DateTimeValidations>>(config?: T): DateTimeField {
	return new DateTimeField((config as any) ?? {}, dateTimeValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.date_time' });
	}

	static override toAPIValue(value: Date[]): string {
		return JSON.stringify(value.map((v) => DateTimeField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): Date[] {
		return JSON.parse(value).map((v: string) => DateTimeField.fromAPIValue(v));
	}
}

export function dateTimeList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): DateTimeListField {
	return new DateTimeListField((config as any) ?? {});
}

export type DimensionUnit = 'METERS' | 'CENTIMETERS' | 'MILLIMETERS' | 'INCHES' | 'FEET' | 'YARDS';

export interface DimensionFieldValue {
	value: number;
	unit: DimensionUnit | Omit<string, DimensionUnit>;
}

export class DimensionField extends Field<DimensionFieldValue> {
	constructor(config: MetafieldFieldDefinitionConfig<DimensionValidations>, validations: Validations) {
		super({ ...config, type: 'dimension' }, validations);
	}

	static override toAPIValue(value: DimensionFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): DimensionFieldValue {
		return JSON.parse(value);
	}
}

export function dimension<T extends MetafieldFieldDefinitionConfig<DimensionValidations>>(config?: T): DimensionField {
	return new DimensionField((config as any) ?? {}, dimensionValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.dimension' });
	}

	static override toAPIValue(value: DimensionFieldValue[]): string {
		return JSON.stringify(value.map((v) => DimensionField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): DimensionFieldValue[] {
		return JSON.parse(value).map((v: string) => DimensionField.fromAPIValue(v));
	}
}

export function dimensionList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): DimensionListField {
	return new DimensionListField((config as any) ?? {});
}

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
	constructor(config: MetafieldFieldDefinitionConfig<VolumeValidations>, validations: Validations) {
		super({ ...config, type: 'volume' }, validations);
	}

	static override toAPIValue(value: VolumeFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): VolumeFieldValue {
		return JSON.parse(value);
	}
}

export function volume<T extends MetafieldFieldDefinitionConfig<VolumeValidations>>(config?: T): VolumeField {
	return new VolumeField((config as any) ?? {}, volumeValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.volume' });
	}

	static override toAPIValue(value: VolumeFieldValue[]): string {
		return JSON.stringify(value.map((v) => VolumeField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): VolumeFieldValue[] {
		return JSON.parse(value).map((v: string) => VolumeField.fromAPIValue(v));
	}
}

export function volumeList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): VolumeListField {
	return new VolumeListField((config as any) ?? {});
}

export type WeightUnit = 'KILOGRAMS' | 'GRAMS' | 'POUNDS' | 'OUNCES';

export interface WeightFieldValue {
	value: number;
	unit: WeightUnit | Omit<string, WeightUnit>;
}

export class WeightField extends Field<WeightFieldValue> {
	constructor(config: MetafieldFieldDefinitionConfig<WeightValidations>, validations: Validations) {
		super({ ...config, type: 'weight' }, validations);
	}

	static override toAPIValue(value: WeightFieldValue): string {
		return `{"value":${DecimalField.toAPIValue(value.value)},"unit":"${value.unit}"}`;
	}

	static override fromAPIValue(value: string): WeightFieldValue {
		return JSON.parse(value);
	}
}

export function weight<T extends MetafieldFieldDefinitionConfig<WeightValidations>>(config?: T): WeightField {
	return new WeightField((config as any) ?? {}, weightValidations);
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
	constructor(config: MetafieldFieldDefinitionConfig<never>) {
		super({ ...(config as any), type: 'list.weight' });
	}

	static override toAPIValue(value: WeightFieldValue[]): string {
		return JSON.stringify(value.map((v) => WeightField.toAPIValue(v)));
	}

	static override fromAPIValue(value: string): WeightFieldValue[] {
		return JSON.parse(value).map((v: string) => WeightField.fromAPIValue(v));
	}
}

export function weightList<T extends Omit<MetafieldFieldDefinitionConfig<never>, 'validations'>>(
	config?: T,
): WeightListField {
	return new WeightListField((config as any) ?? {});
}

export class MetaobjectReferenceField extends Field<string> {
	constructor(config: MetafieldFieldDefinitionConfig, validations: Validations) {
		super({ ...config, type: 'metaobject_reference' }, validations);
	}
}

// references

export function metaobjectReference<T extends MetafieldFieldDefinitionConfig<MetaobjectReferenceValidations>>(
	config?: T,
): MetaobjectReferenceField {
	return new MetaobjectReferenceField((config as any) ?? {}, metaobjectReferenceValidations);
}

export const metaobjectReferenceValidations = {
	metaobjectDefinitionType(value: () => string) {
		return metaobjectDefinition(value());
	},
};

export type MetaobjectReferenceValidations = typeof metaobjectReferenceValidations;

export class ProductField<T> extends Field<T> {
	constructor(config: MetafieldFieldDefinitionConfig, validations: Validations) {
		super({ ...config, type: 'product_reference' }, validations);
	}

	static override toAPIValue(value: any): string {
		return JSON.stringify(value);
	}

	static override fromAPIValue(value: string): any {
		return JSON.parse(value);
	}
}

export function product<T extends MetafieldFieldDefinitionConfig>(config?: T): ProductField<T> {
	return new ProductField((config as any) ?? {}, {});
}

export const productValidations = {};

export type ProductValidations = typeof productValidations;

export class ProductListField<T> extends Field<T[]> {
	constructor(config: MetafieldFieldDefinitionConfig, validations: Validations) {
		super({ ...config, type: 'list.product_reference' }, validations);
	}

	static override toAPIValue(value: any): string {
		return JSON.stringify(value);
	}

	static override fromAPIValue(value: string): any {
		return JSON.parse(value);
	}
}

export function productList<T extends MetafieldFieldDefinitionConfig>(config?: T): ProductListField<T> {
	return new ProductListField((config as any) ?? {}, {});
}

export const productListValidations = productValidations;

export type ProductListValidations = typeof productListValidations;

export class FileField extends Field<Blob> {
	constructor(config: MetafieldFieldDefinitionConfig<FileValidations>, validations: Validations) {
		super({ ...config, type: 'file_reference' }, validations);
	}
}

export function file<T extends MetafieldFieldDefinitionConfig<FileValidations>>(config?: T): FileField {
	return new FileField((config as any) ?? {}, fileValidations);
}

export const fileValidations = {
	fileTypes,
};

export type FileValidations = typeof fileValidations;

export class FileListField extends Field<Blob[]> {
	constructor(config: MetafieldFieldDefinitionConfig<FileListValidations>, validations: Validations) {
		super({ ...config, type: 'list.file_reference' }, validations);
	}
}

export function fileList<T extends MetafieldFieldDefinitionConfig<FileListValidations>>(config?: T): FileListField {
	return new FileListField((config as any) ?? {}, fileListValidations);
}

export const fileListValidations = fileValidations;

export type FileListValidations = typeof fileListValidations;
