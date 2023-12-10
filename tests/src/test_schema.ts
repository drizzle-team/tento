import { metaobject } from '@drizzle-team/shopify';

export const orms = metaobject({
	name: 'ORM',
	type: 'orm',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Name',
			required: true,
			validations: (v) => [v.min(1), v.max(50)],
		}),
		github_repo: f.url({
			name: 'GitHub repo',
			key: 'git_hub_repo',
			required: true,
			validations: (v) => [v.allowedDomains(['github.com'])],
		}),
		stars: f.integer({
			name: 'Stars',
			required: true,
			validations: (v) => [v.min(0)],
		}),
		datetime: f.dateTime({
			validations: (v) => [v.min(new Date('2023-12-01T13:30:00Z')), v.max(new Date('2023-12-02T13:30:00Z'))],
		}),
		multilineText: f.multiLineTextField({
			key: 'multiline_text',
			validations: (v) => [v.min(1), v.max(2), v.regex(/^[a-zA-Z]+$/)],
		}),
		decimal: f.decimal({
			validations: (v) => [v.min(1), v.max(2), v.maxPrecision(2)],
		}),
		decimalList: f.decimalList({
			key: 'decimal_list',
			validations: (v) => [v.min(1), v.max(2), v.maxPrecision(2)],
		}),
		product: f.product(),
		productList: f.productList({
			key: 'product_list',
		}),
		fileSpecific: f.file({
			key: 'file_specific',
			validations: (v) => [v.fileTypes({ images: true, videos: true })],
		}),
		fileAll: f.file({
			key: 'file_all',
		}),
		fileList: f.fileList({
			key: 'file_list',
		}),
		date: f.date({
			validations: (v) => [v.min(new Date('2023-12-01')), v.max(new Date('2023-12-02'))],
		}),
		dateList: f.dateList({
			key: 'date_list',
			validations: (v) => [v.min(new Date('2023-12-01')), v.max(new Date('2023-12-02'))],
		}),
		dimension: f.dimension({
			validations: (v) => [v.min({ value: 1, unit: 'METERS' }), v.max({ value: 5, unit: 'FEET' })],
		}),
		dimensionList: f.dimensionList({
			key: 'dimension_list',
			validations: (v) => [v.min({ value: 1, unit: 'INCHES' }), v.max({ value: 5, unit: 'YARDS' })],
		}),
		volume: f.volume({
			validations: (v) => [v.min({ value: 1, unit: 'MILLILITERS' }), v.max({ value: 4, unit: 'PINTS' })],
		}),
		volumeList: f.volumeList({
			key: 'volume_list',
			validations: (v) => [
				v.min({ value: 1, unit: 'CENTILITERS' }),
				v.max({ value: 4, unit: 'IMPERIAL_FLUID_OUNCES' }),
			],
		}),
		weight: f.weight({
			validations: (v) => [v.min({ value: 1, unit: 'GRAMS' }), v.max({ value: 5, unit: 'OUNCES' })],
		}),
		weightList: f.weightList({
			key: 'weight_list',
			validations: (v) => [v.min({ value: 1, unit: 'KILOGRAMS' }), v.max({ value: 100, unit: 'POUNDS' })],
		}),
	}),
});

export const books = metaobject({
	name: 'Book',
	type: 'book',
	fieldDefinitions: (f) => ({
		title: f.singleLineTextField({
			name: 'Title',
			required: true,
			validations: (v) => [v.min(1), v.max(100)],
		}),
		author: f.singleLineTextField({
			name: 'Author',
			required: true,
			validations: (v) => [v.min(1), v.max(50)],
		}),
		isbn: f.singleLineTextField({
			name: 'ISBN',
			required: true,
			validations: (v) => [v.regex(/^(97(8|9))?\d{9}(\d|X)$/)],
		}),
		publicationDate: f.date({
			name: 'Publication date',
			key: 'publication_date',
			validations: (v) => [v.min(new Date('2000-01-01')), v.max(new Date('2023-12-31'))],
		}),
		genre: f.singleLineTextField({
			name: 'Genre',
			validations: (v) => [v.min(1), v.max(30)],
		}),
		pageCount: f.integer({
			name: 'Page count',
			key: 'page_count',
			required: true,
			validations: (v) => [v.min(1), v.max(2000)],
		}),
		coverType: f.singleLineTextField({
			name: 'Cover type',
			key: 'cover_type',
			validations: (v) => [v.min(1), v.max(20)],
		}),
		language: f.singleLineTextField({
			name: 'Language',
			validations: (v) => [v.min(1), v.max(20)],
		}),
		summary: f.multiLineTextField({
			name: 'Summary',
			validations: (v) => [v.min(10), v.max(5000)],
		}),
		price: f.decimal({
			name: 'Price',
			validations: (v) => [v.min(0), v.max(999.99), v.maxPrecision(2)],
		}),
		bookCover: f.file({
			name: 'Book Cover',
			key: 'book_cover',
			validations: (v) => [v.fileTypes({ images: true })],
		}),
		relatedBooks: f.productList({
			name: 'Related books',
			key: 'related_books',
		}),
	}),
});
