import { Field, fields } from './field';
import type {
	MetaobjectDefinitionConfig,
	InferSelectModel,
	InferUpdateModel,
	MetaobjectDefinition,
	MetaobjectFieldDefinition,
	InferInsertModel,
	InferBaseModel,
} from './types';

const isMetaobjectSym = Symbol.for('tento:isMetaobject');

export class Metaobject<TBaseModel extends MetaobjectDefinitionConfig> {
	// @ts-expect-error - this symbol is used in the instanceof check below
	private readonly [isMetaobjectSym] = true;

	/** @internal */
	fieldKeysMap: Record<string, string> = {};

	/** @internal */
	fields: Record<string, Field<any>>;

	readonly _: {
		readonly config: MetaobjectDefinition;
	};
	declare readonly $inferSelect: InferSelectModel<InferBaseModel<TBaseModel>>;
	declare readonly $inferInsert: InferInsertModel<TBaseModel>;
	declare readonly $inferUpdate: InferUpdateModel<InferBaseModel<TBaseModel>>;
	declare readonly type: string;

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

		this.type = config.type;
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

export function metaobject<T extends MetaobjectDefinitionConfig>(config: T): Metaobject<T> {
	return new Metaobject(config);
}
