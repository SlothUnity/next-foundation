import type { CheckboxField, CollectionSlug } from 'payload';

interface UniqueFlagFieldArgs {
  name: string;

  label: string;

  description: string;

  taken: string;

  collection: CollectionSlug;
}

export function uniqueFlagField({
  name,
  label,
  description,
  taken,
  collection,
}: UniqueFlagFieldArgs): CheckboxField {
  return {
    name,
    type: 'checkbox',
    label,
    defaultValue: false,

    admin: {
      description,
    },

    validate: async (value, { id, req }) => {
      if (!value) {
        return true;
      }

      const existing = await req.payload.find({
        collection,
        where: {
          and: [{ [name]: { equals: true } }, ...(id ? [{ id: { not_equals: id } }] : [])],
        },
        limit: 1,
        depth: 0,
      });

      if (existing.docs.length > 0) {
        return taken;
      }

      return true;
    },
  };
}
