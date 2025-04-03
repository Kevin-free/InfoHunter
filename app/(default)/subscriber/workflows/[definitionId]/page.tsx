import { notFound } from 'next/navigation';
import { DataWorkflowDetail } from './data-workflow-detail';
import { getDefinitionById } from '@/lib/actions/data-workflow';
import { WorkflowDefinition } from '@/lib/schema';

export default async function DataWorkflowDetailPage({
  params
}: {
  params: Promise<{ definitionId: string }>;
}) {
  const { definitionId } = await params;
  const definition = await getDefinitionById(definitionId);

  if (!definition) {
    notFound();
  }

  return (
    <DataWorkflowDetail
      definition={definition as WorkflowDefinition}
      backLink="/subscriber/workflows"
      backLabel="Back to Workflows"
    />
  );
}
