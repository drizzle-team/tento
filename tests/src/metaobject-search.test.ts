import config from '../tento.config';
import { createClient, metaobject, tento } from '@drizzle-team/tento';
import { afterAll, describe, expect, test } from 'vitest';
import { skipTests } from './common';

export const book = metaobject({
	name: 'Book',
	type: 'book',
	fieldDefinitions: (f) => ({
		title: f.singleLineTextField({
			name: 'Title',
			required: true,
		}),
		price: f.decimal({
			name: 'Price',
		}),
	}),
});

export const author = metaobject({
	name: 'Author',
	type: 'author',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Name',
			required: true,
		}),
		last_name: f.decimal({
			name: 'Last name',
		}),
	}),
});

const schema = { book, author };

skipTests([
	// doesn't work
	'display_name $raw + sortKey: id',
	'display_name string',
	'display_name $not',
	'updated_at equal',
]);

afterAll(async () => {
	const client = tento({
		client: createClient({
			shop: config.shop,
			headers: config.headers,
		}),
		schema: {},
	});
	await client.applySchema();
});

describe('search metaobject entity', async () => {
	const client = tento({
		client: createClient({
			shop: config.shop,
			headers: config.headers,
		}),
		schema,
	});
	await client.applySchema();

	type BookToInsert = typeof client.metaobjects.book.$inferInsert;
	type Book = typeof client.metaobjects.book.$inferSelect;
	const randomBookMock: BookToInsert[] = [
		{ title: 'Beyond the Veil', price: 1 },
		{ title: 'Dancing with Shadows', price: 2 },
		{ title: 'Echoes in the Abyss', price: 3 },
		{ title: 'Stars Beneath the Surface', price: 3 },
		{ title: 'Threads of Destiny', price: 4 },
		{ title: 'The Enigma of Time', price: 5 },
		{ title: 'The Last Garden', price: 6 },
		{ title: "The Clockmaker's Secret", price: 7 },
		{ title: 'The Ultimate Journey', price: 8 },
		{ title: 'Whispers of the Forgotten', price: 9 },
	];

	const insertedBooks: Book[] = [];
	let echoesBookUpdatedAtTime: Date | null = null;
	let whispersBookUpdatedAtTime: Date | null = null;
	for (const randomBookToInsert of randomBookMock) {
		// wait 600 ms to make them
		await new Promise((resolve) => setTimeout(resolve, 600));
		const createdBook = await client.metaobjects.book.insert(randomBookToInsert);

		if (randomBookToInsert.title === 'Echoes in the Abyss') {
			echoesBookUpdatedAtTime = createdBook._updatedAt;
		} else if (randomBookToInsert.title === 'Whispers of the Forgotten') {
			whispersBookUpdatedAtTime = createdBook._updatedAt;
		}

		insertedBooks.push(createdBook);
	}

	/**
	 * Set timeout for 4 sec because shopify need time to insert everything
	 */
	await new Promise((resolve) => setTimeout(resolve, 4000));

	test('display_name equal', async () => {
		const whisperBook = insertedBooks.find((book) => book.title === 'Whispers of the Forgotten');
		if (!whisperBook) throw Error();

		const whispersBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				displayName: whisperBook._displayName,
			},
		});

		expect(whispersBook.pageInfo.hasNextPage).toBeFalsy();
		expect(whispersBook.pageInfo.hasPreviousPage).toBeFalsy();
		expect(whispersBook.pageInfo.startCursor).not.toBeNull();
		expect(whispersBook.pageInfo.endCursor).not.toBeNull();

		expect(whispersBook.items).toHaveLength(1);
		expect(whispersBook.items[0]!.price).toBe(9);
		expect(whispersBook.items[0]!.title).toBe('Whispers of the Forgotten');
	});

	test("display_name $or + sortKey: display_name (doesn't work) -> updated_at", async () => {
		const whisperBook = insertedBooks.find((book) => book.title === 'Whispers of the Forgotten');
		const echoesBook = insertedBooks.find((book) => book.title === 'Echoes in the Abyss');
		if (!whisperBook || !echoesBook) throw Error();

		const whispersOrEchoesBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				$or: [
					{
						displayName: whisperBook._displayName,
					},
					{
						displayName: echoesBook._displayName,
					},
				],
			},
			sortKey: 'updated_at',
			reverse: false,
		});

		expect(whispersOrEchoesBook.items).toHaveLength(2);

		expect(whispersOrEchoesBook.items[0]!.price).toBe(3);
		expect(whispersOrEchoesBook.items[1]!.price).toBe(9);

		expect(whispersOrEchoesBook.items[0]!.title).toBe('Echoes in the Abyss');
		expect(whispersOrEchoesBook.items[1]!.title).toBe('Whispers of the Forgotten');
	});

	test("reversed display_name $or + sortKey: display_name (doesn't work) -> updated_at", async () => {
		const whisperBook = insertedBooks.find((book) => book.title === 'Whispers of the Forgotten');
		const echoesBook = insertedBooks.find((book) => book.title === 'Echoes in the Abyss');
		if (!whisperBook || !echoesBook) throw Error();

		const whispersOrEchoesBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				$or: [
					{
						displayName: whisperBook._displayName,
					},
					{
						displayName: echoesBook._displayName,
					},
				],
			},
			sortKey: 'updated_at',
			reverse: true,
		});

		expect(whispersOrEchoesBook.items).toHaveLength(2);

		expect(whispersOrEchoesBook.items[0]!.price).toBe(9);
		expect(whispersOrEchoesBook.items[1]!.price).toBe(3);

		expect(whispersOrEchoesBook.items[0]!.title).toBe('Whispers of the Forgotten');
		expect(whispersOrEchoesBook.items[1]!.title).toBe('Echoes in the Abyss');
	});

	/**
	 * Doesn't work for metaobjects
	 */
	test('display_name $raw + sortKey: id', async () => {
		const whisperBook = insertedBooks.find((book) => book.title === 'Whispers of the Forgotten');
		if (!whisperBook) throw Error();
		const whispersOrEchoesBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				$raw: `display_name:${whisperBook}`,
			},
			sortKey: 'id',
		});

		expect(whispersOrEchoesBook.items).toHaveLength(1);
		expect(whispersOrEchoesBook.items[0]!.title).toBe('Threads of Destiny');
		expect(whispersOrEchoesBook.items[1]!.title).toBe('The Enigma of Time');
		expect(whispersOrEchoesBook.items[2]!.title).toBe('The Last Garden');
		expect(whispersOrEchoesBook.items[3]!.title).toBe("The Clockmaker's Secret");
		expect(whispersOrEchoesBook.items[4]!.title).toBe('The Ultimate Journey');
	});

	/**
	 * Doesn't work for metaobjects
	 */
	test('display_name string', async () => {
		const threadsBook = insertedBooks.find((book) => book.title === 'Threads of Destiny');
		if (!threadsBook) throw Error();

		const whispersOrEchoesBook = await client.metaobjects.book.list({
			first: 10,
			query: threadsBook._displayName,
		});

		expect(whispersOrEchoesBook.items).toHaveLength(1);
		expect(whispersOrEchoesBook.items[0]!.title).toBe('Threads of Destiny');
	});

	/**
	 * Doesn't work for metaobjects
	 */
	test('display_name $not', async () => {
		const threadsBook = insertedBooks.find((book) => book.title === 'Threads of Destiny');
		if (!threadsBook) throw Error();

		const whispersOrEchoesBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				displayName: {
					$not: threadsBook._displayName,
				},
			},
		});

		expect(whispersOrEchoesBook.items).toHaveLength(9);
	});

	test('updated_at $gt + $gte', async () => {
		// $gt
		const booksGtEchoes = await client.metaobjects.book.list({
			first: 10,
			query: {
				updatedAt: {
					$gt: echoesBookUpdatedAtTime!,
				},
			},
		});

		expect(booksGtEchoes.items).toHaveLength(8);
		expect(booksGtEchoes.items[0]!.title).toBe('Echoes in the Abyss');

		// $gte
		const booksGteEchoes = await client.metaobjects.book.list({
			first: 10,
			query: {
				updatedAt: {
					$gte: echoesBookUpdatedAtTime!,
				},
			},
		});

		expect(booksGteEchoes.items).toHaveLength(8);
		expect(booksGteEchoes.items[0]!.title).toBe('Echoes in the Abyss');
	});

	test('updated_at $lt + $lte + reverse', async () => {
		// $lt
		const booksLtWhispers = await client.metaobjects.book.list({
			first: 10,
			query: {
				updatedAt: {
					$lt: whispersBookUpdatedAtTime!,
				},
			},
			reverse: true,
		});

		expect(booksLtWhispers.items).toHaveLength(9);
		expect(booksLtWhispers.items[0]!.title).toBe('The Ultimate Journey');

		// $lte
		const booksLteWhispers = await client.metaobjects.book.list({
			first: 10,
			query: {
				updatedAt: {
					$lte: whispersBookUpdatedAtTime!,
				},
			},
			reverse: true,
		});

		expect(booksLteWhispers.items).toHaveLength(9);
		expect(booksLteWhispers.items[0]!.title).toBe('The Ultimate Journey');
	});

	/**
	 * Doesn't work for metaobjects
	 */
	test('updated_at equal', async () => {
		const echoesBook = await client.metaobjects.book.list({
			first: 10,
			query: {
				updatedAt: echoesBookUpdatedAtTime!,
			},
		});

		expect(echoesBook.pageInfo.hasNextPage).toBeFalsy();
		expect(echoesBook.pageInfo.hasPreviousPage).toBeFalsy();
		expect(echoesBook.pageInfo.startCursor).not.toBeNull();
		expect(echoesBook.pageInfo.endCursor).not.toBeNull();

		expect(echoesBook.items).toHaveLength(1);
		expect(echoesBook.items[0]!.price).toBeNull();
		expect(echoesBook.items[0]!.title).toBe('Echoes in the Abyss');
	});
});
