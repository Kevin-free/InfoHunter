import { workflowDefinitions } from '@/lib/schema';
import { db } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { qstashService } from '@/lib/services/qstash';
import { v4 as uuidv4 } from 'uuid';
import { verifyJWT } from '@/lib/jwt';
import { WorkflowScheduleStatus } from '@/lib/types';
import { CreditService } from '@/lib/services/creditService';

// Create a data workflow definition
export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtSub = await verifyJWT(token || '');

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has available workflow slots
    const hasEnoughSlots = await CreditService.hasEnoughWorkflowSlots(
      jwtSub.userId
    );
    if (!hasEnoughSlots) {
      return NextResponse.json(
        {
          error: 'Workflow limit reached',
          message:
            'You have reached your workflow limit. Please purchase more workflow slots to create additional workflows.'
        },
        { status: 403 }
      );
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
      timeWindowUnit,
      isPrivate
    } = body;

    if (!name || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const [workflowDefinition] = await db
      .insert(workflowDefinitions)
      .values({
        workflowDefinitionId: uuidv4(),
        userId: jwtSub.userId,
        name,
        prompt,
        model: model || process.env.OPENROUTER_MODEL || '',
        refreshIntervalHours,
        scheduleId: '',
        status: WorkflowScheduleStatus.PAUSED,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageStrategy: messageStrategy || 'latest_n',
        messageCount: messageCount || 100,
        timeWindowValue: timeWindowValue || 24,
        timeWindowUnit: timeWindowUnit || 'hours',
        isPrivate: isPrivate || false
      })
      .returning();

    if (refreshIntervalHours === 0) {
      return NextResponse.json({ workflowDefinition });
    }

    // 创建 QStash 定时任务
    const schedule = await qstashService.createWorkflowSchedule(
      workflowDefinition.workflowDefinitionId,
      refreshIntervalHours
    );

    await db
      .update(workflowDefinitions)
      .set({ scheduleId: schedule.scheduleId })
      .where(
        eq(
          workflowDefinitions.workflowDefinitionId,
          workflowDefinition.workflowDefinitionId
        )
      );

    return NextResponse.json({ workflowDefinition });
  } catch (error) {
    console.error('Error creating data workflow definition:', error);
    return NextResponse.json(
      { error: 'Failed to create data workflow definition' },
      { status: 500 }
    );
  }
}

// Get all data workflow definitions
export async function GET(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db
      .select()
      .from(workflowDefinitions)
      .where(eq(workflowDefinitions.userId, jwtSub.userId));

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error fetching data workflow definitions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data workflow definitions' },
      { status: 500 }
    );
  }
}
