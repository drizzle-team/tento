import type { TypedDocumentString } from '../graphql/gen/graphql';

export type Fetch = typeof fetch;

export interface ResponseErrors {
	networkStatusCode?: number;
	message?: string;
	graphQLErrors?: any[];
}

export interface ClientResponse<TData> {
	data?: TData;
	errors?: ResponseErrors;
}

export const isClientSym = Symbol.for('tento:isClient');

interface RawClient {
	<TResult = any, TVars extends Record<string, unknown> = Record<string, unknown>>(
		query: string | TypedDocumentString<TResult, TVars>,
		vars?: TVars,
	): Promise<ClientResponse<TResult>>;
}

export interface Client extends RawClient {
	[isClientSym]: true;
}

export interface ShopifyApiClient {
	query(params: { data?: string | { [key: string]: unknown } }): Promise<{ body: any }>;
}

export type ClientSource = RawClient | ShopifyApiClient;

/** @internal */
export function createClientFromSource(source: ClientSource): Client {
	if (typeof source === 'function' && isClientSym in source && source[isClientSym] === true) {
		return source as Client;
	}
	let client: RawClient;
	if ('query' in source) {
		client = async (query, vars) => {
			const result = await source.query({ data: { query, variables: vars } });
			if (result.body.errors) {
				throw new Error(JSON.stringify(result.body.errors));
			}
			return result.body;
		};
	} else {
		throw new Error('Invalid client source');
	}

	return Object.assign(client, { [isClientSym]: true as const });
}

// TODO() Provide API version for GQL !!!
export function createClient({
	shop,
	headers = {},
	fetch = globalThis.fetch,
}: {
	shop: string;
	headers?: Record<string, string>;
	fetch?: Fetch;
}): Client {
	const client: RawClient = async (query, vars) => {
		const response = await fetch(`https://${shop}.myshopify.com/admin/api/2023-10/graphql.json`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...headers,
			},
			body: JSON.stringify({ query, variables: vars }),
		});
		const result = await response.json();
		if (result.errors) {
			throw new Error(JSON.stringify(result.errors));
		}
		return result;
	};
	return Object.assign(client, { [isClientSym]: true as const });
}
