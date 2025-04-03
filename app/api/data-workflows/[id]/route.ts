import { verifyJWT } from '@/lib/jwt';
import {
  db,
  workflowDefinitions,
  workflowValues,
  channelWorkflows
} from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { qstashService } from '@/lib/services/qstash';

// Update workflow
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate authorization
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      prompt,
      model,
      refreshIntervalHours,
      messageStrategy,
      messageCount,
      timeWindowValue,
      timeWindowUnit
    } = body;

    // Update workflow definition
    const [updatedWorkflow] = await db
      .update(workflowDefinitions)
      .set({
        name,
        prompt,
        model,
        refreshIntervalHours,
        messageStrategy: messageStrategy || 'latest_n',
        messageCount: messageCount || 100,
        timeWindowValue: timeWindowValue || 24,
        timeWindowUnit: timeWindowUnit || 'hours',
        updatedAt: new Date()
      })
      .where(
        and(
          eq(workflowDefinitions.workflowDefinitionId, id),
          eq(workflowDefinitions.userId, jwtSub.userId)
        )
      )
      .returning();

    if (!updatedWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found or no permission' },
        { status: 404 }
      );
    }

    // Update QStash schedule if necessary
    if (updatedWorkflow.scheduleId && refreshIntervalHours > 0) {
      const cronExpression = `0 */${refreshIntervalHours} * * *`;
      await qstashService.updateWorkflowSchedule(
        updatedWorkflow.scheduleId,
        updatedWorkflow.workflowDefinitionId,
        cronExpression
      );
    } else if (refreshIntervalHours > 0) {
      // Create a new schedule if it doesn't exist
      const schedule = await qstashService.createWorkflowSchedule(
        updatedWorkflow.workflowDefinitionId,
        refreshIntervalHours
      );

      await db
        .update(workflowDefinitions)
        .set({ scheduleId: schedule.scheduleId })
        .where(
          eq(
            workflowDefinitions.workflowDefinitionId,
            updatedWorkflow.workflowDefinitionId
          )
        );
    }

    return NextResponse.json({ workflowDefinition: updatedWorkflow });
  } catch (error) {
    console.error('Error updating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

// Delete workflow
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 验证认证
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 获取工作流以获取 scheduleId
    const [workflow] = await db
      .select()
      .from(workflowDefinitions)
      .where(eq(workflowDefinitions.workflowDefinitionId, id));

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // 删除 QStash 定时任务
    if (workflow.scheduleId) {
      await qstashService.deleteWorkflowSchedule(workflow.scheduleId);
    }

    // 使用事务删除 workflowDefinitions、channel_workflows 和 workflow_values
    await db.transaction(async (tx) => {
      // 删除 workflow_values 记录
      await tx
        .delete(workflowValues)
        .where(eq(workflowValues.workflowDefinitionId, id));

      // 删除 channel_workflows 关联记录
      await tx
        .delete(channelWorkflows)
        .where(eq(channelWorkflows.workflowDefinitionId, id));

      // 删除 workflowDefinitions
      await tx
        .delete(workflowDefinitions)
        .where(eq(workflowDefinitions.workflowDefinitionId, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
