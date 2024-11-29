import 'dotenv/config';

import chalk from 'chalk';
import prompt from 'prompt';
import { literal, object, optional, safeParse, string, tuple, union, type InferOutput, boolean } from 'valibot';
import arg from 'arg';
import semver from 'semver';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import * as utils from 'node:util';

export const assertNodeVersion = () => {
	if (semver.gte(process.version, '18.0.0')) return;

	console.log(`${chalk.red.bold('err: ')}Tento requires NodeJS v18 or above`);
	process.exit(1);
};

import type {
	CreateMetaobjectDefinitionMutation,
	DeleteMetaobjectDefinitionMutation,
	CreateMetaobjectDefinitionMutationVariables,
	DeleteMetaobjectDefinitionMutationVariables,
} from '../graphql/gen/graphql';
import { readLocalSchema, type Config } from './index';
import { createClient } from '../client/gql-client';
import {
	MetafieldIntrospection,
	MetaobjectIntrospection,
	diffMetafieldSchemas,
	diffSchemas,
	setMetaobjectIdFor,
	introspectMetafieldRemoteSchema,
	introspectMetaobjectRemoteSchema,
} from '../client/diff';

const argsSchema = object({
	'--config': optional(string(), 'tento.config.ts'),
	'--dry-run': optional(boolean()),
	'--debug': optional(boolean()),
	_: tuple([union([literal('pull'), literal('push')])]),
});

type Args = InferOutput<typeof argsSchema>;

async function main() {
	prompt.message = '';
	prompt.start();

	const rawArgv = arg({
		'--config': String,
		'--dry-run': Boolean,
		'--debug': Boolean,
	});
	const argsParseResult = safeParse(argsSchema, rawArgv);
	if (!argsParseResult.success) {
		console.log('Usage: tento <command> [options]\n');
		console.log('Commands:');
		console.log('  pull\t synchronize the metaobject and the metafield definitions from Shopify to the local schema');
		console.log(
			'  push [--dry-run]\t synchronize the metaobject and the metafield definitions from the local schema to Shopify',
		);
		console.log('\nOptions:');
		console.log('  --config <path>\t path to the config file (default: tento.config.ts)');
		console.log('  --debug');

		if (rawArgv['--debug']) {
			console.log(utils.inspect(argsParseResult.issues, { colors: true, depth: null }));
		}

		process.exit(1);
	}

	assertNodeVersion();

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
	const configPath = path.resolve(args['--config']);
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

	return (await import(configPath)).default;
}

async function push(args: Args) {
	const config = await readConfig(args);
	const client = createClient({ shop: config.shop, headers: config.headers });
	const schemaPath = path.resolve(path.dirname(args['--config']), config.schemaPath);

	const [schemas, metaobjectIntrospection, metafieldIntrospection] = await Promise.all([
		readLocalSchema(schemaPath),
		introspectMetaobjectRemoteSchema(client),
		introspectMetafieldRemoteSchema(client),
	]);

	const { metaobjectSchema, metafieldSchema } = schemas;

	const diffMetaobject = diffSchemas({
		local: metaobjectSchema,
		remote: metaobjectIntrospection,
	});
	const diffMetafield = diffMetafieldSchemas({
		local: metafieldSchema,
		remote: metafieldIntrospection,
	});

	if (
		!diffMetaobject.create.length &&
		!diffMetaobject.update.length &&
		!diffMetaobject.delete.length &&
		!diffMetafield.create.length && !diffMetafield.update.length &&
		!diffMetafield.delete.length
	) {
		console.log(chalk.gray('😴 Schema is already up to date, no changes required'));
		return;
	}

	if (args['--dry-run']) {
		console.log(chalk.yellow.bold('⚠️ This is a dry run, no changes will be applied'));
		console.log(chalk.yellow('The following changes were detected:'));
		console.log(utils.inspect(diffMetaobject, { colors: true, depth: null }));
		return;
	}

	let shouldConfirm = false;

	if (diffMetaobject.delete.length > 0) {
		shouldConfirm = true;
		console.log(chalk.red.bold('❗ The following metaobject definitions will be DELETED:'));
		for (const id of diffMetaobject.delete) {
			const definition = metaobjectIntrospection.find((d) => d.id === id)!;
			console.log(chalk.red(`  - ${definition.name ?? definition.type}`));
		}
	}

	// Only for metaobjects due to possibility to have many fieldDefinitions
	const fieldsToDelete: Record<string, string[]> = {};
	if (diffMetaobject.update.length > 0) {
		for (const update of diffMetaobject.update) {
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
			const definition = metaobjectIntrospection.find((d) => d.id === id)!;
			console.log(chalk.red(`  - ${definition.name ?? definition.type}: ${fields.join(', ')}`));
		}
	}

	/**
	 * TODO() maybe need to recheck key + namespace if something match is could be just update
	 * 	and no need to ask for deletion ???
	 */
	if (diffMetafield.delete.length > 0) {
		shouldConfirm = true;
		console.log(chalk.red.bold('❗ The following metafield definitions will be DELETED:'));
		for (const id of diffMetafield.delete) {
			const definition = metafieldIntrospection.find((d) => d.id === id)!;
			console.log(chalk.red(`  - ${definition.namespace ?? 'custom'}.${definition.key}`));
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

	// Metaobject
	const createQuery = /* GraphQL */ `
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

	for (const create of diffMetaobject.create) {
		const result = await client<CreateMetaobjectDefinitionMutation, CreateMetaobjectDefinitionMutationVariables>(
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

	const updateQuery = /* GraphQL */ `
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

	for (const update of diffMetaobject.update) {
		const result = await client(updateQuery, {
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
		const metaobject = metaobjectIntrospection.find((d) => d.id === update.id)!;
		if (metaobject.name !== name) {
			name = `"${metaobject.name}" -> ${name}`;
		}
		console.log(chalk.gray(`- Updated metaobject definition "${name}"`));
	}

	const deleteQuery = /* GraphQL */ `
		mutation DeleteMetaobjectDefinition($id: ID!) {
			metaobjectDefinitionDelete(id: $id) {
				userErrors {
					field, message
				}
			}
		}`;

	for (const id of diffMetaobject.delete) {
		const result = await client<DeleteMetaobjectDefinitionMutation, DeleteMetaobjectDefinitionMutationVariables>(
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
		const metaobject = metaobjectIntrospection.find((d) => d.id === id)!;
		console.log(chalk.gray(`- Deleted metaobject definition "${metaobject.name}"`));
	}

	// Metafield
	const createMetafieldQuery = /* GraphQL */ `
		mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
			metafieldDefinitionCreate(definition: $definition) {
				createdDefinition {
					namespace
					key
				}
				userErrors {
					field, message
				}
			}
		}
	`;

	for (const create of diffMetafield.create) {
		const referenceValidations = create.definition.validations?.filter((v) => v.name === 'metaobject_definition_id');
		if (typeof referenceValidations !== 'undefined') {
			await setMetaobjectIdFor({ client, validations: referenceValidations });
		}

		const result = await client(createMetafieldQuery, { definition: create.definition });
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metafieldDefinitionCreate?.userErrors?.length) {
			console.error(result.data.metafieldDefinitionCreate.userErrors);
			process.exit(1);
		}
		const metafieldName = `${result.data!.metafieldDefinitionCreate!.createdDefinition!.namespace}.${
			result.data!.metafieldDefinitionCreate!.createdDefinition!.key
		}`;
		console.log(chalk.gray(`- Created metafield definition "${metafieldName}"`));
	}

	const updateMetafieldQuery = /* GraphQL */ `
		mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
			metafieldDefinitionUpdate(definition: $definition) {
				updatedDefinition {
					id
					namespace
					key
				}
				userErrors {
					field, message
				}
			}
		}
	`;

	for (const update of diffMetafield.update) {
		const { definition } = update;

		const referenceValidations = definition.validations?.filter((v) => v.name === 'metaobject_definition_id');
		if (typeof referenceValidations !== 'undefined') {
			await setMetaobjectIdFor({ client, validations: referenceValidations });
		}

		const result = await client(updateMetafieldQuery, {
			definition: {
				description: definition.description ?? undefined,
				key: definition.key,
				ownerType: definition.ownerType,
				name: definition.name ?? undefined,
				namespace: definition.namespace ?? undefined,
				pin: typeof definition.pin !== 'undefined' ? definition.pin : undefined,
				useAsCollectionCondition:
					typeof definition.useAsCollectionCondition !== 'undefined' ? definition.useAsCollectionCondition : undefined,
				validations: definition.validations ?? undefined,
			},
		});
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metafieldDefinitionUpdate?.userErrors?.length) {
			console.error(result.data.metafieldDefinitionUpdate.userErrors);
			process.exit(1);
		}
		let name = `"${result.data!.metafieldDefinitionUpdate!.updatedDefinition!.namespace}.${
			result.data!.metafieldDefinitionUpdate!.updatedDefinition!.key
		}"`;

		const metafield = metafieldIntrospection.find((d) => d.id === update.id)!;
		const metafieldName = `"${metafield.namespace}.${metafield.key}"`;
		if (metafieldName !== name) {
			name = `${metafield.name} -> ${name}`;
		}
		console.log(chalk.gray(`- Updated metafield definition ${name}`));
	}

	const deleteMetafieldQuery = /* GraphQL */ `
		mutation DeleteMetafieldDefinition($id: ID!) {
			metafieldDefinitionDelete(id: $id) {
				userErrors {
					field, message
				}
			}
		}`;

	for (const id of diffMetafield.delete) {
		const result = await client(deleteMetafieldQuery, { id });
		if (result.errors?.graphQLErrors?.length) {
			console.error(result.errors.graphQLErrors);
			process.exit(1);
		}
		if (result.data?.metafieldDefinitionDelete?.userErrors?.length) {
			console.error(result.data.metafieldDefinitionDelete.userErrors);
			process.exit(1);
		}
		const metafield = metafieldIntrospection.find((d) => d.id === id)!;
		console.log(chalk.gray(`- Deleted metafield definition "${metafield.namespace}.${metafield.key}"`));
	}

	console.log(chalk.green('✅ All changes applied'));
}

async function pull(args: Args) {
	const config = await readConfig(args);
	const schemaPath = path.resolve(path.dirname(args['--config']), config.schemaPath);
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

	const client = createClient({ shop: config.shop, headers: config.headers });

	const metaobjectIntrospection = await introspectMetaobjectRemoteSchema(client);
	const metafieldsIntrospection = await introspectMetafieldRemoteSchema(client);
	if (!metaobjectIntrospection.length && !metafieldsIntrospection.length) {
		console.log(chalk.yellow.bold('No metaobject | metafield definitions detected'));
		console.log(chalk.gray('Hint: you can use "sp push" to push the local schema to Shopify'));
		process.exit(1);
	}

	// metaobject + metafield codegen ready
	const codegen: (string | undefined)[] = [
		`import { metaobject${metafieldsIntrospection.length ? ', metafield' : ''} } from '@drizzle-team/tento';\n`,
	];
	for (const definition of metaobjectIntrospection) {
		codegen.push(
			`export const ${definition.type} = metaobject({`,
			`\tname: '${definition.name}',`,
			`\ttype: '${definition.type}',`,
			typeof definition.description === 'string'
				? `\tdescription: '${definition.description.replace("'", "\\'")}',`
				: undefined,
			'\tfieldDefinitions: (f) => ({',
			...(definition.fieldDefinitions?.flatMap((field) => {
				const definition = mapMetaobjectFieldDefinition(field);

				return [`\t\t${field.key}: f.${mapFieldName(field.type)}(${definition}),`];
			}) ?? []),
			'\t}),',
			'});\n',
		);
	}

	if (metafieldsIntrospection.length) {
		for (const definition of metafieldsIntrospection) {
			codegen.push(
				`export const ${definition.key} = metafield({`,
				`\tname: '${definition.name}',`,
				`\tkey: '${definition.key}',`,
				`\tnamespace: '${definition.namespace}',`,
				`\townerType: '${definition.ownerType}',`,
				typeof definition.description === 'string'
					? `\tdescription: '${definition.description.replace("'", "\\'")}',`
					: undefined,
				!definition.pin ? undefined : `\tpin: ${definition.pin},`,
				`\tfieldDefinition: (f) => f.${mapFieldName(
					definition.fieldDefinition.type,
				)}(${mapMetafieldValidationsDefinition(definition.fieldDefinition)})`,
				'});\n',
			);
		}
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

function mapMetaobjectFieldDefinition(field: MetaobjectIntrospection[number]['fieldDefinitions'][number]) {
	const result: Record<string, string> = {};
	if (field.name !== field.key) {
		result['name'] = `'${field.name!.replace("'", "\\'")}'`;
	}
	if (field.required) {
		result['required'] = 'true';
	}

	if (typeof field.description === 'string' && field.description !== '') {
		result['description'] = `'${field.description.replace("'", "\\'")}'`;
	}

	if (field.validations.length) {
		const validations = mapValidations(field.type, field.validations);
		if (validations) {
			result['validations'] = validations;
		}
	}

	if (!Object.keys(result).length) {
		return '';
	}
	return ['{', ...Object.entries(result).map(([key, value]) => `\t\t\t${key}: ${value},`), '\t\t}'].join('\n');
}

function mapMetafieldValidationsDefinition(field: MetafieldIntrospection[number]['fieldDefinition']) {
	const result: Record<string, string> = {};
	if (field.validations.length) {
		const validations = mapValidations(field.type, field.validations);
		if (validations) {
			result['validations'] = validations;
		}
	}

	if (!Object.keys(result).length) {
		return '';
	}
	return ['{', ...Object.entries(result).map(([key, value]) => `\t\t\t${key}: ${value},`), '\t\t}'].join('\n');
}

function mapValidations(
	fieldType: string,
	validations: MetaobjectIntrospection[number]['fieldDefinitions'][number]['validations'],
) {
	if (!validations.length) {
		return undefined;
	}

	const result: string[] = [];

	for (const validation of validations) {
		switch (validation.name) {
			case 'min':
			case 'max': {
				let value;
				if (['dimension', 'volume', 'weight'].some((t) => fieldType === t || fieldType === `list.${t}`)) {
					value = jsonStringify(JSON.parse(validation.value!));
				} else if (
					['single_line_text_field', 'multi_line_text_field', 'number_integer', 'number_decimal'].some(
						(t) => fieldType === t || fieldType === `list.${t}`,
					)
				) {
					value = validation.value!;
				} else {
					value = `'${validation.value!.replace("'", "\\'")}'`;
				}
				result.push(`v.${validation.name}(${value})`);
				break;
			}
			case 'max_precision': {
				result.push(`v.maxPrecision(${validation.value})`);
				break;
			}
			case 'regex': {
				result.push(`v.regex(/${validation.value!.replace('/', '\\/')}/)`);
				break;
			}
			case 'allowed_domains': {
				result.push(`v.allowedDomains(${jsonStringify(JSON.parse(validation.value!))})`);
				break;
			}
			case 'file_type_options': {
				const value: Record<string, true> = {};
				for (const type of JSON.parse(validation.value!)) {
					switch (type) {
						case 'Image': {
							value['images'] = true;
							break;
						}
						case 'Video': {
							value['videos'] = true;
							break;
						}
					}
				}
				result.push(`v.fileTypes(${jsonStringify(value)})`);
				break;
			}
			case 'choices': {
				result.push(`v.choices(${jsonStringify(JSON.parse(validation.value!))})`);
				break;
			}
			case 'metaobject_reference': {
				result.push(`v.metaobjectDefinitionType(() => ${validation.value}.type)`);
				break;
			}
			default: {
				result.push(jsonStringify(validation));
			}
		}
	}

	if (result.length > 2) {
		return `(v) => [${result.map((s) => `\n\t\t\t\t${s},`).join('')}\n\t\t\t]`;
	}
	return `(v) => [${result.join(', ')}]`;
}

function jsonStringify(obj: any) {
	if (Array.isArray(obj)) {
		return `[${obj.map((v) => JSON.stringify(v)).join(', ')}]`;
	}

	return `{ ${Object.keys(obj)
		.map((k) => `${k}: ${JSON.stringify(obj[k])}`)
		.join(', ')} }`;
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => {
		prompt.stop();
	});
