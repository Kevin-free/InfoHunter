import { eq } from 'drizzle-orm';
import { workflowDefinitions } from '../schema';
import { db } from '../schema';

export async function getDefinitionById(definitionId: string) {
  const definition = await db
    .select()
    .from(workflowDefinitions)
    .where(eq(workflowDefinitions.workflowDefinitionId, definitionId))
    .then((rows) => rows[0]);

  return definition;
}
