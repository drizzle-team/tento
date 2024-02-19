<div align="center">

# Tento

### Shopify data framework for NodeJS and TypeScript

<h6>Tento [店頭] means "shop" 🛍️ in Japanese</h6>

[Discord](https://driz.link/discord) | [Website](https://drizzle.team) | [Twitter](https://twitter.com/drizzleorm) | [Docs](https://github.com/drizzle-team/tento)
</div>

## Overview

Tento provides a simple yet powerful API for working with Shopify data, including metaobjects and metafields.
It also provides a CLI tool for two-way synchronization between your local schema definition and Shopify.

## Quick Start

### Installation

You can install Tento with your preferred package manager:

```bash
npm install @drizzle-team/tento
yarn add @drizzle-team/tento
pnpm add @drizzle-team/tento
bun add @drizzle-team/tento
```

### Schema

Declare your Tento metaobjects schema in `schema.ts` file.
As of now Tento CLI only supports one schema file:

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
import { tento } from '@drizzle-team/tento';
import * as schema from './schema';

// Using @shopify/shopify-api (or its wrappers)
import '@shopify/shopify-api/adapters/node';
import { shopifyApi, ApiVersion } from '@shopify/shopify-api';
const shopifyClient = shopifyApi({ ... });
const gqlClient = new shopifyApiClient.clients.Graphql({
  session: ...,
});

// Using raw fetch
import { createClient } from '@drizzle-team/tento';
const gqlClient = createClient({
  shop: 'your-shop-name',
  headers: {
    // any headers you need
    // Content-Type is added automatically unless you override it
    'X-Shopify-Access-Token': 'your-admin-api-access-token',
  },
  fetch: customFetch, // optionally provide your own fetch implementation
});

// Create Tento client from any Shopify client above
const client = tento({
  client: gqlClient,
  schema,
});

// Apply the local schema to Shopify
await client.applySchema();

// Query metaobjects
const designers = await tento.metaobjects.designers.list({
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

Tento CLI will consume `tento.config.ts` and fetch your Shopify schema to your project `schema.ts` file:

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
    json: f.json(),
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

It will consume your `tento.config.ts` file, traverse your schema and apply any diffs to Shopify.

### Queries

Tento supports all Shopify Metaobject API methods:

`.list()`

```ts
tento.metaobjects.designers.list({
  query: {
    $raw: 'state:disabled AND ("sale shopper" OR VIP)',
  },
});

tento.metaobjects.designers.list({
  query: ['Bob', 'Norman'],
});

tento.metaobjects.designers.list({
  query: {
    displayName: {
      $raw: 'Bob Norman',
    },
  },
});

tento.metaobjects.designers.list({
  query: {
    displayName: 'Bob Norman',
    updatedAt: new Date('2023-01-01'),
  },
});

tento.metaobjects.designers.list({
  query: {
    updatedAt: {
      $gte: new Date('2023-01-01'),
      $lte: new Date('2024-01-01'),
    },
  },
});

tento.metaobjects.designers.list({
  query: {
    displayName: {
      $not: 'bob',
    },
  },
});

tento.metaobjects.designers.list({
  query: [{ $or: ['bob', 'norman'] }, 'Shopify'],
});

tento.metaobjects.designers.list({
  query: [{ displayName: 'Bob' }, { $or: ['sale shopper', 'VIP'] }],
});

tento.metaobjects.designers.list({
  query: {
    displayName: 'Bob Norman',
  },
});

tento.metaobjects.designers.list({
  query: 'norm*',
});

tento.metaobjects.designers.list({
  query: {
    displayName: 'norm*',
  },
});
```

## Roadmap

- [x] Accept existing Shopify client instance
- [x] Support OAuth
- [x] Expose CLI operations as API
- [x] Allow providing custom `fetch` implementation
- [ ] Support all field types and validations
- [ ] Metafields management
- [ ] Assign metaobjects to resources and metafields
- [ ] Products management
- [ ] Support multiple schema files
