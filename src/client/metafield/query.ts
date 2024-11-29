import { Metafield } from './metafield';

export class ShopifyMetafieldOperations<T extends Metafield> {
	readonly _: {
		readonly metafield: T;
	};

	constructor(metafield: T) {
		this._ = { metafield };
	}
}

export type TentoMetafieldOperationsMap<TSchema extends Record<string, Metafield>> = {
	[K in keyof TSchema]: ShopifyMetafieldOperations<TSchema[K]>;
};
