import type { CheckboxField, CollectionSlug } from 'payload';

interface UniqueFlagFieldArgs {
  /** O nome do campo, que é também o que se procura na query de unicidade. */
  name: string;

  label: string;

  /** A descrição mostrada por baixo da checkbox no admin. */
  description: string;

  /** O que o editor lê quando outro documento já tem a marca. */
  taken: string;

  collection: CollectionSlug;
}

/**
 * Uma checkbox que só um documento da collection pode ter ligada.
 *
 * É o padrão do `isHome` — «esta é a homepage» — e do `is404` — «esta é a página
 * de erro». Ambos precisam exactamente da mesma validação, e a segunda cópia da
 * mesma regra é como as divergências entram: corrige-se uma e esquece-se a outra.
 *
 * A validação só corre quando o valor é `true`. Desligar a marca nunca pode falhar,
 * senão um documento marcado por engano ficava impossível de gravar.
 *
 * O `not_equals: id` é o que permite gravar o próprio documento sem ele se
 * autodetectar como conflito. Não existe na criação, onde ainda não há `id`.
 *
 * Isto **não** garante que exista um documento marcado — só que não existe mais do
 * que um. Quem lê tem de lidar com a ausência; ver o `resolvePayloadPage`.
 */
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
