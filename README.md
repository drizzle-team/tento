<div align="center">
  
# Tento

### TypeScript SDK for Shopify Metaobjects API
Tento [店頭] means Shop 🛍️ in Japanese  
[Discord](https://driz.link/discord) | [Website](https://drizzle.team) | [Twitter](https://twitter.com/drizzleorm) | [Docs](https://github.com/drizzle-team/tento)
</div>


## Overview
Tento provides you a simple yet powerfull API for declaring Shopify Metaobjects typescript schema and querying them from Shopify.  
It has a CLI companion to pull schema from Shopify and push local changes back to it.

## Quick Start
### Installation 
You can install Tento with your preferred package manager
```bash
npm install tento
yarn add tento
pnpm add tento
bun add tento
```

### Schema
Declare your Tento metaobject schema in `schema.ts` file  
!As of now Tento CLI only supports one schema file
```ts 
import { metaobject } from '@drizzle-team/tento';

export const designers = metaobject({
  name: 'Designer',
  type: 'designer',
  fieldDefinitions: (f) => ({
    fullName: f.singleLineTextField({
      name: 'Full Name',
      required: true,
      validations: (v) => [v.min(5), v.max(100)],
    }),
    description: f.singleLineTextField({
      name: 'Description',
      required: true,
      validations: (v) => [v.min(5), v.max(300)],
    }),
    link: f.url(({
      name: 'Link',
      validations: (v) => [v.allowedDomains(["github.com"])],
    }),
  }),
});
```

### Tento queries client
```ts
import { client } from '@drizzle-team/tento';
import * as schema from './schema'

const tento = client({
  shop: 'd91122', // your store id https://admin.shopify.com/store/d91122 <-
  headers: {
    'X-Shopify-Access-Token': process.env['SHOPIFY_ADMIN_API_TOKEN']!,
  },
  schema,
});

const designers = await tento.designers.list({
  first: 10,
});
/* 
  {
    _id: string;
    _handle: string;
    _updatedAt: Date;
    fullName: string;
    description: string;
    link: string;
  }[]
*/
```

### Schema Migrations | Pull
Now let's pull your existing Shopify Metaobjects schema, first we need to create a `tento.config.ts` file:
```ts
import { defineConfig } from '@drizzle-team/tento/cli';

export default defineConfig({
  schemaPath: './src/schema.ts',
  shop: 'd91122',
  headers: {
    'X-Shopify-Access-Token': process.env['SHOPIFY_ADMIN_API_TOKEN']!,
  },
});
```
Now let's run Tento CLI `pull` command
```bash
npx tento pull
yarn tento pull
pnpm tento pull
bun tento pull
```

Tento CLI will consume `tento.config.ts` and fetch your Shopify Metaobjects schema to your project `schema.ts` file:
```ts
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
      name: 'GitHub repo',
      required: true,
      validations: (v) => [v.allowedDomains(["github.com"])],
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
      validations: (v) => [
        v.min(1),
        v.max(2),
        v.regex(/^[a-zA-Z]+$/),
      ],
    }),
    decimal: f.decimal({
      validations: (v) => [
        v.min(1.0),
        v.max(2.0),
        v.maxPrecision(2),
      ],
    }),
    decimal_list: f.decimalList({
      required: true,
      validations: (v) => [
        v.min(1.0),
        v.max(2.0),
        v.maxPrecision(2),
      ],
    }),
    date_list: f.dateList({
      validations: (v) => [v.min('2023-12-01'), v.max('2023-12-02')],
    }),
    dimension: f.dimension({
      validations: (v) => [v.min({ value: 1, unit: "METERS" }), v.max({ value: 5, unit: "FEET" })],
    }),
    dimension_list: f.dimensionList({
      validations: (v) => [v.min({ value: 1, unit: "INCHES" }), v.max({ value: 5, unit: "YARDS" })],
    }),
    volume: f.volume({
      validations: (v) => [v.min({ value: 1, unit: "MILLILITERS" }), v.max({ value: 4, unit: "PINTS" })],
    }),
    volume_list: f.volumeList({
      validations: (v) => [v.min({ value: 1, unit: "CENTILITERS" }), v.max({ value: 4, unit: "IMPERIAL_FLUID_OUNCES" })],
    }),
    date: f.date({
      validations: (v) => [v.min('2023-12-01'), v.max('2023-12-02')],
    }),
    weight: f.weight({
      validations: (v) => [v.min({ value: 1, unit: "GRAMS" }), v.max({ value: 5, unit: "OUNCES" })],
    }),
    weight_list: f.weightList({
      validations: (v) => [v.min({ value: 1, unit: "KILOGRAMS" }), v.max({ value: 100, unit: "POUNDS" })],
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
      validations: (v) => [
        v.min(0.0),
        v.max(999.99),
        v.maxPrecision(2),
      ],
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
```

### Schema Migrations | Push
Whenever you change your locall schema - you can apply changes to your Shopify by using `tento push` command:
```bash
~ npx tento push

- Updated metaobject definition "ORM"
✅ All changes applied
```
It will consume your `tento.config.ts` file, traverse your schema and apply any diffs to the remote

### Queries
Tento supports all Shopify Metaobject API methods:

`.list()`
```ts
tento.designers.list({
  query: {
    $raw: 'state:disabled AND ("sale shopper" OR VIP)',
  },
});

tento.designers.list({
  query: ['Bob', 'Norman'],
});

tento.designers.list({
  query: {
    displayName: {
      $raw: 'Bob Norman',
    },
  },
});

tento.designers.list({
  query: {
    displayName: 'Bob Norman',
    updatedAt: new Date('2023-01-01'),
  },
});

tento.designers.list({
  query: {
    updatedAt: {
      $gte: new Date('2023-01-01'),
      $lte: new Date('2024-01-01'),
    },
  },
});

tento.designers.list({
  query: {
    displayName: {
      $not: 'bob',
    },
  },
});

tento.designers.list({
  query: [{ $or: ['bob', 'norman'] }, 'Shopify'],
});

tento.designers.list({
  query: [{ displayName: 'Bob' }, { $or: ['sale shopper', 'VIP'] }],
});

tento.designers.list({
  query: {
    displayName: 'Bob Norman',
  },
});

tento.designers.list({
  query: 'norm*',
});

tento.designers.list({
  query: {
    displayName: 'norm*',
  },
});
```
