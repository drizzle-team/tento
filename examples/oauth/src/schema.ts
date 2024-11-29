import { metaobject, metafield } from '@drizzle-team/tento';

export const name = metafield({
	name: 'Name',
	ownerType: 'PRODUCT',
	pin: true,
	description: '',
	key: 'name',
	namespace: 'custom',
	visibleToStorefrontApi: true,
	fieldDefinition: (f) =>
		f.singleLineTextField({
			validations: (v) => [v.min(1), v.max(50)],
		}),
});

export const description = metafield({
	name: 'Description',
	key: 'description',
	namespace: 'custom',
	ownerType: 'PRODUCT',
	fieldDefinition: (f) => f.multiLineTextField(),
});

export const designer = metaobject({
	name: 'Designer',
	type: 'designer',
	fieldDefinitions: (f) => ({
		name: f.singleLineTextField({
			name: 'Title',
			required: true,
			validations: (v) => [v.min(1), v.max(50)],
		}),
		description: f.multiLineTextField({
			name: 'Description',
		}),
		website: f.url({
			name: 'Website',
		}),
	}),
});

export const designer_reference = metafield({
	name: 'Designer',
	key: 'designer',
	namespace: 'custom',
	ownerType: 'PRODUCT',
	fieldDefinition: (f) =>
		f.metaobjectReference({
			validations: (v) => [v.metaobjectDefinitionType(() => designer.type)],
		}),
});
