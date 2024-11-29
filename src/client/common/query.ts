import { Client } from '../gql-client';

export class ShopifyJobOperations {
	constructor(private client: Client) {}

	async get(id: string): Promise<{
		id: string;
		done: boolean;
	}> {
		const query = `
        query GetJob ($id: ID!) {
            job(id: $id) {
              id
              done
            }
        }`;

		const result = await this.client(query, { id });

		if (result.errors) {
			throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		return {
			id: String(result.data.job.id),
			done: Boolean(result.data.job.done),
		};
	}
}

export class ShopifyJobOperation {
	readonly _: {
		readonly jobId: string;
	};
	done: boolean;

	constructor(private client: Client, jobId: string, done: boolean) {
		this._ = {
			jobId,
		};
		this.done = done;
	}

	/**
	 * TODO() choose another function name
	 *
	 */
	async checkDone(): Promise<boolean> {
		const query = `
        query GetJob ($id: ID!) {
            job(id: $id) {
              id
              done
            }
        }`;

		const result = await this.client(query, { id: this._.jobId });

		if (result.errors) {
			throw new Error(result.errors.graphQLErrors?.map((e) => e.message).join('\n'));
		}

		this.done = Boolean(result.data.job.done);
		return this.done;
	}
}
