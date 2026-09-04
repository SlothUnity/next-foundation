import { z } from 'zod';

import { createModuleComponent, defineModule } from '@/core/modules';

export const testHeadlineSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
});

type TestHeadlineProps = z.infer<typeof testHeadlineSchema>;

function TestHeadline({ title, subtitle }: TestHeadlineProps) {
  return (
    <section>
      <h2>{title}</h2>

      {subtitle ? <p>{subtitle}</p> : null}
    </section>
  );
}

export const TEST_HEADLINE_ALIAS = 'test-headline';

export const testHeadlineModule = defineModule({
  alias: TEST_HEADLINE_ALIAS,
  name: 'Test Headline',
  schema: testHeadlineSchema,
  component: createModuleComponent(TestHeadline),
});
