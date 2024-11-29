import 'dotenv/config';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: [
			// 'src/metafield.test.ts',
			// 'src/metaobject-search.test.ts',
			// 'src/metaobject.test.ts',
			// 'src/product.test.ts',
		],
		exclude: [],
		typecheck: {
			tsconfig: 'tsconfig.json',
		},
		testTimeout: 100000,
		hookTimeout: 100000,
		isolate: false,
		poolOptions: {
			threads: {
				singleThread: true,
			},
		},
	},
});
