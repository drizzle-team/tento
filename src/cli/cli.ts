#!/usr/bin/env node --import tsx
import 'dotenv/config';

import chalk from 'chalk';
import prompt from 'prompt';
import { literal, object, optional, safeParse, string, tuple, union, type Output } from 'valibot';
import minimist from 'minimist';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

import type {
	CreateMetaobjectDefinitionMutation,
	DeleteMetaobjectDefinitionMutation,
	CreateMetaobjectDefinitionMutationVariables,
	UpdateMetaobjectDefinitionMutation,
	DeleteMetaobjectDefinitionMutationVariables,
} from 'src/graphql/gen/types/admin.generated.js';
import type { MutationMetaobjectDefinitionUpdateArgs } from 'src/graphql/gen/types/admin.types.js';
import { createGQLClient, diffSchemas, introspectRemoteSchema, readLocalSchema, type Config } from './index.js';
import type { MetaobjectFieldDefinition } from '@drizzle-team/shopify';

const argsSchema = object({
	config: optional(string(), 'shopify.config.ts'),
	_: tuple([union([literal('pull'), literal('push')])]),
});

type Args = Output<typeof argsSchema>;

async function main() {
	prompt.message = '';
	prompt.start();

	const rawArgv = minimist(process.argv.slice(2));
	const argsParseResult = safeParse(argsSchema, rawArgv);
	if (!argsParseResult.success) {
		console.log('Usage: sp <command> [options]\n');
		console.log('Commands:');
		console.log('  pull\t synchronize the metaobject definitions from Shopify to the local schema');
		console.log('  push\t synchronize the metaobject definitions from the local schema to Shopify');
		console.log('\nOptions:');
		console.log('  --config <path>\t path to the config file (default: shopify.config.ts)');

		process.exit(1);
	}

	const args = argsParseResult.output;

	switch (args._[0]) {
		case 'pull': {
			await pull(args);
			break;
		}
		case 'push': {
			await push(args);
			break;
		}
	}
}

async function readConfig(args: Args): Promise<Config> {
	const configPath = path.resolve(args.config);
	const configStat = await fs.stat(configPath).catch(() => undefined);
	if (!configStat) {
		console.log(chalk.red.bold(`ERROR: "${configPath}" does not exist`));
		console.log(chalk.gray('Hint: you can use "--config <path>" to specify a non-default config file location'));
		process.exit(1);
	}
	if (!configStat.isFile()) {
		console.log(chalk.red.bold(`ERROR: "${configPath}" should be a file`));
		process.exit(1);
	}

	return require(configPath).default;
}

async function push(args: Args) {
	const config = await readConfig(args);

	const gql = createGQLClient(fetch, `https://${config.shop}.myshopify.com/admin/api/2023-10/graphql.json`, {
		'Content-Type': 'application/json',
		...config.headers,
	});

	const schemaPath = path.resolve(path.dirname(args.config), config.schemaPath);

	const [schema, introspection] = await Promise.all([readLocalSchema(schemaPath), introspectRemoteSchema(gql)]);
	const diff = diffSchemas(schema, introspection);

	if (!diff.create.length && !diff.update.length && !diff.delete.length) {
		console.log(chalk.gray('✅ Schema is already up to date, no changes required'));
		return;
	}

	let shouldConfirm = false;

	if (diff.delete.length > 0) {
		shouldConfirm = true;
		console.log(chalk.red.bold('❗ The following metaobject definitions will be DELETED:'));
		for (const id of diff.delete) {
			const definition = introspection.find((d) => d.id === id)!;
			console.log(chalk.red(`  - ${definition.name ?? definition.type}`));
		}
	}

	const fieldsToDelete: Record<string, string[]> = {};

	if (diff.update.length > 0) {
		for (const update of diff.update) {
			for (const field of update.definition.fieldDefinitions ?? []) {
				if (field.delete) {
					fieldsToDelete[update.id] ??= [];
					fieldsToDelete[update.id]!.push(field.delete.key);
				}
			}
		}
	}

	if (Object.keys(fieldsToDelete).length) {
		shouldConfirm = true;
		console.log(chalk.red.bold('❗ The following metaobject definition fields will be DELETED:'));
		for (const [id, fields] of Object.entries(fieldsToDelete)) {
			const definition = introspection.find((d) => d.id === id)!;
			console.log(chalk.red(`  - ${definition.name ?? definition.type}: ${fields.join(', ')}`));
		}
	}

	if (shouldConfirm) {
		console.log();
		const { choice } = await prompt.get({
			properties: {
				choice: {
					description: chalk.red('Are you sure you want to continue? (yes/no)'),
					pattern: /^(?:yes|no)$/,
					message: chalk.red('Only "yes" or "no" is accepted as input'),
					required: true,
				},
			},
		});
		if (choice !== 'yes') {
			console.log(chalk.gray('\nAction cancelled. That was close!'));
			process.exit(1);
		}
		console.log();
	}

	const createQuery = `#graphql
		mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
			metaobjectDefinitionCreate(definition: $definition) {
				metaobjectDefinition {
					name
				}
				userErrors {
					field, message
				}
			}
		}
	`;

	for (const create of diff.create) {
		const result = await gql<CreateMetaobjectDefinitionMutation, CreateMetaobjectDefinitionMutationVariables>(
			createQuery,
			{ definition: create.definition },
		);
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metaobjectDefinitionCreate?.userErrors?.length) {
			console.error(result.data.metaobjectDefinitionCreate.userErrors);
			process.exit(1);
		}
		console.log(
			chalk.gray(
				`- Created metaobject definition "${result.data!.metaobjectDefinitionCreate!.metaobjectDefinition!.name}"`,
			),
		);
	}

	const updateQuery = `#graphql
		mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
			metaobjectDefinitionUpdate(id: $id, definition: $definition) {
				metaobjectDefinition {
					name
				}
				userErrors {
					field, message
				}
			}
		}
	`;

	for (const update of diff.update) {
		const result = await gql<UpdateMetaobjectDefinitionMutation, MutationMetaobjectDefinitionUpdateArgs>(updateQuery, {
			id: update.id,
			definition: update.definition,
		});
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metaobjectDefinitionUpdate?.userErrors?.length) {
			console.error(result.data.metaobjectDefinitionUpdate.userErrors);
			process.exit(1);
		}
		let name = `"${result.data!.metaobjectDefinitionUpdate!.metaobjectDefinition!.name}"`;
		const metaobject = introspection.find((d) => d.id === update.id)!;
		if (metaobject.name !== name) {
			name = `"${metaobject.name}" -> ${name}`;
		}
		console.log(
			chalk.gray(
				`- Updated metaobject definition "${result.data!.metaobjectDefinitionUpdate!.metaobjectDefinition!.name}"`,
			),
		);
	}

	const deleteQuery = `#graphql
		mutation DeleteMetaobjectDefinition($id: ID!) {
			metaobjectDefinitionDelete(id: $id) {
				userErrors {
					field, message
				}
			}
		}`;

	for (const id of diff.delete) {
		const result = await gql<DeleteMetaobjectDefinitionMutation, DeleteMetaobjectDefinitionMutationVariables>(
			deleteQuery,
			{ id },
		);
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metaobjectDefinitionDelete?.userErrors?.length) {
			console.error(result.data.metaobjectDefinitionDelete.userErrors);
			process.exit(1);
		}
		const metaobject = introspection.find((d) => d.id === id)!;
		console.log(chalk.gray(`- Deleted metaobject definition "${metaobject.name}"`));
	}

	console.log(chalk.green('✅ All changes applied'));
}

async function pull(args: Args) {
	const config = await readConfig(args);

	const schemaPath = path.resolve(path.dirname(args.config), config.schemaPath);
	const schemaStat = await fs.stat(schemaPath).catch(() => undefined);
	if (schemaStat) {
		if (!schemaStat.isFile()) {
			console.error(chalk.red.bold(`ERROR: "${schemaPath}" should be a file`));
			process.exit(1);
		}
		const { choice } = await prompt.get({
			properties: {
				choice: {
					description: chalk.yellow.bold(`File "${schemaPath}" already exists, overwrite? (yes/no)`),
					default: 'no',
					pattern: /^(?:yes|no)$/,
					message: 'Only "yes" or "no" is accepted as input',
				},
			},
		});
		if (choice !== 'yes') {
			console.log(chalk.gray('\nPlease specify a different schema file location.'));
			process.exit(1);
		}
	}

	const gql = createGQLClient(fetch, `https://${config.shop}.myshopify.com/admin/api/2023-10/graphql.json`, {
		'Content-Type': 'application/json',
		...config.headers,
	});

	const introspection = await introspectRemoteSchema(gql);

	if (!introspection.length) {
		console.log(chalk.yellow.bold('No metaobject definitions detected'));
		console.log(chalk.gray('Hint: you can use "sp push" to push the local schema to Shopify'));
		process.exit(1);
	}

	const codegen: (string | undefined)[] = ["import { metaobject } from '@drizzle-team/shopify';\n"];
	for (const definition of introspection) {
		codegen.push(
			`export const ${definition.type} = metaobject({`,
			`\tname: '${definition.name}',`,
			`\ttype: '${definition.type}',`,
			definition.description !== undefined
				? `\tdescription: '${definition.description.replace("'", "\\'")}',`
				: undefined,
			'\tfieldDefinitions: (f) => ({',
			...(definition.fieldDefinitions?.flatMap((field) => {
				const definition = mapFieldDefinition(field);

				return [`\t\t${field.key}: f.${mapFieldName(field.type)}(${definition}),`];
			}) ?? []),
			'\t}),',
			'});\n',
		);
	}

	console.log(chalk.gray(`Writing schema to "${schemaPath}"`));

	await fs.mkdir(path.dirname(schemaPath), { recursive: true });
	await fs.writeFile(schemaPath, codegen.filter((s) => s !== undefined).join('\n'));

	console.log(chalk.green('✅ Schema successfully pulled!'));
}

function mapFieldName(field: string) {
	let isList = false;
	if (field.startsWith('list.')) {
		isList = true;
		field = field.slice(5);
	}
	const replacements: Record<string, string> = {
		number_integer: 'integer',
		number_decimal: 'decimal',
		product_reference: 'product',
		file_reference: 'file',
	};
	let result;
	if (field in replacements) {
		result = replacements[field];
	} else {
		result = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}
	if (isList) {
		result += 'List';
	}
	return result;
}

function mapFieldDefinition(field: MetaobjectFieldDefinition) {
	const result: Record<string, string> = {};
	if (field.name !== field.key) {
		result['name'] = `'${field.name!.replace("'", "\\'")}'`;
	}
	if (field.required) {
		result['required'] = 'true';
	}

	if (field.description !== undefined && field.description !== '') {
		result['description'] = `'${field.description.replace("'", "\\'")}'`;
	}

	if (!Object.keys(result).length) {
		return '';
	}
	return ['{', ...Object.entries(result).map(([key, value]) => `\t\t\t${key}: ${value},`), '\t\t}'].join('\n');
}

function mapValidations(validations: )

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => {
		prompt.stop();
	});
