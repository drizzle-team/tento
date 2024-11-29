import { Client } from './gql-client';

export const job = async ({
	id,
	client,
}: {
	id: string;
	client: Client;
}): Promise<{
	id: string;
	done: boolean;
}> => {
	const query = `
        query GetJob ($id: ID!) {
            job(id: $id) {
              id
              done
            }
        }`;

	const result = await client(query, { id });

	if (result.errors) {
		throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
	}

	return {
		id: String(result.data.job.id),
		done: Boolean(result.data.job.done),
	};
};
