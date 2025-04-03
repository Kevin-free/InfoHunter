import { db, workflowDefinitions, workflowValues } from '@/lib/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params;

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
        { status: 400 }
      );
    }

    // 使用 Drizzle ORM 查询
    const values = await db
      .select({
        id: workflowValues.id,
        workflow_value_id: workflowValues.workflowValueId,
        workflow_definition_id: workflowValues.workflowDefinitionId,
        channel_id: workflowValues.channelId,
        value: workflowValues.value,
        confidence: workflowValues.confidence,
        reason: workflowValues.reason,
        version: workflowValues.version,
        status: workflowValues.status,
        is_aggregated: workflowValues.isAggregated,
        created_at: workflowValues.createdAt,
        updated_at: workflowValues.updatedAt,
        workflow_name: workflowDefinitions.name
      })
      .from(workflowValues)
      .leftJoin(
        workflowDefinitions,
        eq(
          workflowValues.workflowDefinitionId,
          workflowDefinitions.workflowDefinitionId
        )
      )
      .where(eq(workflowValues.channelId, channelId))
      .orderBy(desc(workflowValues.updatedAt));

    return NextResponse.json({ workflowValues: values }, { status: 200 });
  } catch (error) {
    console.error('Error fetching workflow values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow values' },
      { status: 500 }
    );
  }
}
