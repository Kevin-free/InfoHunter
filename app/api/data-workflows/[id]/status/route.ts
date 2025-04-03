import { verifyJWT } from '@/lib/jwt';
import { db, workflowDefinitions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { qstashService } from '@/lib/services/qstash';
import { WorkflowScheduleStatus } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update workflow status
    const [workflow] = await db
      .update(workflowDefinitions)
      .set({
        status,
        updatedAt: new Date()
      })
      .where(eq(workflowDefinitions.workflowDefinitionId, id))
      .returning();

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Handle QStash schedule
    if (status === WorkflowScheduleStatus.PAUSED) {
      await qstashService.pauseWorkflowSchedule(workflow.scheduleId);
    } else {
      await qstashService.resumeWorkflowSchedule(workflow.scheduleId);
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return NextResponse.json(
      { error: 'Failed to update workflow status' },
      { status: 500 }
    );
  }
}
