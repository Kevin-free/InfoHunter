import { db, workflowDefinitions, channelWorkflows } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, and, not } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;
    const { searchParams } = new URL(request.url);
    const isPrivate = searchParams.get('isPrivate') === 'true';

    // Query to get workflow definitions for a channel with privacy filter
    const workflowDefinitionsList = await db
      .select({
        workflow_definition_id: workflowDefinitions.workflowDefinitionId,
        name: workflowDefinitions.name,
        prompt: workflowDefinitions.prompt,
        status: workflowDefinitions.status,
        updated_at: workflowDefinitions.updatedAt,
        created_at: workflowDefinitions.createdAt,
        refresh_interval_hours: workflowDefinitions.refreshIntervalHours,
        is_private: workflowDefinitions.isPrivate
      })
      .from(channelWorkflows)
      .innerJoin(
        workflowDefinitions,
        eq(
          channelWorkflows.workflowDefinitionId,
          workflowDefinitions.workflowDefinitionId
        )
      )
      .where(
        and(
          eq(channelWorkflows.channelId, channelId),
          isPrivate
            ? eq(workflowDefinitions.isPrivate, true)
            : eq(workflowDefinitions.isPrivate, false)
        )
      );

    return NextResponse.json({
      workflowDefinitions: workflowDefinitionsList
    });
  } catch (error) {
    console.error('Failed to fetch workflow definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow definitions' },
      { status: 500 }
    );
  }
}
