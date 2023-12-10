import { metaobject } from '@drizzle-team/shopify';

export const orm = metaobject({
	name: 'ORM',
	type: 'orm',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Name',
			required: true,
		}),
		git_hub_repo: f.url({
			name: 'GitHub repo',
			required: true,
		}),
		stars: f.integer({
			name: 'Stars',
			required: true,
		}),
		datetime: f.dateTime(),
		multiline_text: f.multiLineTextField(),
		decimal: f.decimal(),
		decimal_list: f.decimalList({
			required: true,
		}),
		date_list: f.dateList(),
		dimension: f.dimension(),
		dimension_list: f.dimensionList(),
		volume: f.volume(),
		volume_list: f.volumeList(),
		date: f.date(),
		weight: f.weight(),
		weight_list: f.weightList(),
	}),
});

export const book = metaobject({
	name: 'Book',
	type: 'book',
	fieldDefinitions: (f) => ({
		title: f.singleLineTextField({
			name: 'Title',
			required: true,
		}),
		author: f.singleLineTextField({
			name: 'Author',
			required: true,
		}),
		isbn: f.singleLineTextField({
			name: 'ISBN',
			required: true,
		}),
		genre: f.singleLineTextField({
			name: 'Genre',
		}),
		language: f.singleLineTextField({
			name: 'Language',
		}),
		summary: f.multiLineTextField({
			name: 'Summary',
		}),
		price: f.decimal({
			name: 'Price',
		}),
		book_cover: f.file({
			name: 'Book Cover',
		}),
		related_books: f.productList({
			name: 'Related books',
		}),
		publication_date: f.date({
			name: 'Publication date',
		}),
		page_count: f.integer({
			name: 'Page count',
			required: true,
		}),
		cover_type: f.singleLineTextField({
			name: 'Cover type',
		}),
	}),
});
