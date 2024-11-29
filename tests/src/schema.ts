import { metaobject } from '@drizzle-team/tento';

export const orm = metaobject({
	name: 'ORM',
	type: 'orm',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Name',
			required: true,
			validations: (v) => [v.min(1), v.max(50)],
		}),
		git_hub_repo: f.url({
			name: 'GitHub Repo',
			required: true,
			validations: (v) => [v.allowedDomains(['github.com'])],
		}),
		stars: f.integer({
			name: 'Stars',
			required: true,
			validations: (v) => [v.min(0)],
		}),
		datetime: f.dateTime({
			validations: (v) => [v.min('2023-12-01T13:30:00Z'), v.max('2023-12-02T13:30:00Z')],
		}),
		multiline_text: f.multiLineTextField({
			validations: (v) => [v.min(1), v.max(2), v.regex(/^[a-zA-Z]+$/)],
		}),
		decimal: f.decimal({
			validations: (v) => [v.min(1.0), v.max(2.0), v.maxPrecision(2)],
		}),
		decimal_list: f.decimalList({
			required: true,
			validations: (v) => [v.min(1.0), v.max(2.0), v.maxPrecision(2)],
		}),
		date_list: f.dateList({
			validations: (v) => [v.min('2023-12-01'), v.max('2023-12-02')],
		}),
		dimension: f.dimension({
			validations: (v) => [v.min({ value: 1, unit: 'METERS' }), v.max({ value: 5, unit: 'FEET' })],
		}),
		dimension_list: f.dimensionList({
			validations: (v) => [v.min({ value: 1, unit: 'INCHES' }), v.max({ value: 5, unit: 'YARDS' })],
		}),
		volume: f.volume({
			validations: (v) => [v.min({ value: 1, unit: 'MILLILITERS' }), v.max({ value: 4, unit: 'PINTS' })],
		}),
		volume_list: f.volumeList({
			validations: (v) => [
				v.min({ value: 1, unit: 'CENTILITERS' }),
				v.max({ value: 4, unit: 'IMPERIAL_FLUID_OUNCES' }),
			],
		}),
		date: f.date({
			validations: (v) => [v.min('2023-12-01'), v.max('2023-12-02')],
		}),
		weight: f.weight({
			validations: (v) => [v.min({ value: 1, unit: 'GRAMS' }), v.max({ value: 5, unit: 'OUNCES' })],
		}),
		weight_list: f.weightList({
			validations: (v) => [v.min({ value: 1, unit: 'KILOGRAMS' }), v.max({ value: 100, unit: 'POUNDS' })],
		}),
	}),
});

export const book = metaobject({
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
		genre: f.singleLineTextField({
			name: 'Genre',
			validations: (v) => [v.min(1), v.max(30)],
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
			validations: (v) => [v.min(0.0), v.max(999.99), v.maxPrecision(2)],
		}),
		publication_date: f.date({
			name: 'Publication date',
			validations: (v) => [v.min('2000-01-01'), v.max('2023-12-31')],
		}),
		page_count: f.integer({
			name: 'Page count',
			required: true,
			validations: (v) => [v.min(1), v.max(2000)],
		}),
		cover_type: f.singleLineTextField({
			name: 'Cover type',
			validations: (v) => [v.min(1), v.max(20)],
		}),
	}),
});
