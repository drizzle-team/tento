import { Field, fields } from './field';
import type {
	MetaobjectDefinitionConfig,
	InferSelectModel,
	InferUpdateModel,
	InferBaseModel,
	MetaobjectDefinition,
	MetaobjectFieldDefinition,
} from './types';

const isMetaobjectSym = Symbol.for('tento:isMetaobject');

export class Metaobject<TBaseModel extends Record<string, any>> {
	// @ts-expect-error - this symbol is used in the instanceof check below
	private readonly [isMetaobjectSym] = true;

	/** @internal */
	fieldKeysMap: Record<string, string> = {};

	/** @internal */
	fields: Record<string, Field<any>>;

	readonly _: {
		readonly config: MetaobjectDefinition;
	};
	declare readonly $inferSelect: InferSelectModel<TBaseModel>;
	declare readonly $inferInsert: TBaseModel;
	declare readonly $inferUpdate: InferUpdateModel<TBaseModel>;

	constructor(config: MetaobjectDefinitionConfig) {
		this.fields = config.fieldDefinitions(fields);
		const fieldDefinitions: MetaobjectFieldDefinition[] = [];

		for (const [key, value] of Object.entries(this.fields)) {
			const definition: MetaobjectFieldDefinition = {
				...value._.config,
				key: value._.config.key ?? key,
			};
			fieldDefinitions.push(definition);
			this.fieldKeysMap[key] = definition.key;
		}
		this._ = {
			config: {
				...config,
				fieldDefinitions,
			},
		};
	}

	static [Symbol.hasInstance](instance: unknown) {
		return (
			typeof instance === 'object' &&
			instance !== null &&
			isMetaobjectSym in instance &&
			instance[isMetaobjectSym] === true
		);
	}
}

export function metaobject<T extends MetaobjectDefinitionConfig>(config: T): Metaobject<InferBaseModel<T>> {
	return new Metaobject(config);
}
