import { Field, fields } from './field';
import { MetafieldDefinition, MetafieldDefinitionConfig, MetafieldFieldDefinition } from './types';

const isMetafieldSym = Symbol.for('tento:isMetafield');

export class Metafield<TName extends string = string> {
	// @ts-expect-error - this symbol is used in the instanceof check below
	private readonly [isMetafieldSym] = true;

	/** @internal */
	field: Field<any>;

	readonly _: {
		readonly config: MetafieldDefinition;
	};

	constructor(config: MetafieldDefinitionConfig<TName>) {
		this.field = config.fieldDefinition(fields);
		const definition: MetafieldFieldDefinition = {
			...this.field._.config,
			key: this.field._.config.key!,
		};

		this._ = {
			config: {
				...config,
				fieldDefinition: definition!,
			},
		};
	}

	static [Symbol.hasInstance](instance: unknown) {
		return (
			typeof instance === 'object' &&
			instance !== null &&
			isMetafieldSym in instance &&
			instance[isMetafieldSym] === true
		);
	}
}

export function metafield<T extends MetafieldDefinitionConfig>(config: T & { name: T['name'] }): Metafield<T['name']> {
	return new Metafield<T['name']>(config);
}
