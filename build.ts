import { build } from 'tsup';
import * as esbuild from 'esbuild';
import fs from 'fs/promises';

await Promise.all([
	build({
		entry: {
			'cli/index': 'src/cli/index.ts',
			'client/index': 'src/client/index.ts',
		},
		dts: {
			resolve: true,
		},
		format: ['cjs', 'esm'],
		splitting: false,
		treeshake: true,
		external: ['@drizzle-team/shopify'],
		tsconfig: 'src/tsconfig.json',
	}),
	esbuild.build({
		entryPoints: ['src/cli/cli.ts'],
		outfile: 'dist/cli/cli.cjs',
		bundle: true,
		format: 'cjs',
		platform: 'node',
		target: 'node18',
		minify: true,
		external: ['@drizzle-team/shopify'],
		banner: {
			js: '#!/usr/bin/env node --import tsx',
		},
	}),
]);

await fs.copyFile('package.json', 'dist/package.json');
