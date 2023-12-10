import type { TypedDocumentString } from 'src/graphql/gen/graphql';

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

export interface GQLClient {
	<TResult = any, TVars = Record<string, unknown>>(
		query: string | TypedDocumentString<TResult, TVars>,
		vars?: TVars,
	): Promise<ClientResponse<TResult>>;
}

export function createGQLClient(fetch: Fetch, shop: string, headers: Record<string, string>) {
	const client: GQLClient = async (query, vars) => {
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
	return client;
}
