import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/schema';
import { creditConsumptionLogs, userCredits } from '@/lib/schema';
import { eq, desc, and, gte, lte, inArray, sql, isNotNull } from 'drizzle-orm';
import { verifyJWT } from '@/lib/jwt';
import { workflowDefinitions } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const model = searchParams.get('model');
    const workflowId = searchParams.get('workflowId');
    const userType = searchParams.get('userType') || 'subscriber';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtPayload = await verifyJWT(token || '');

    if (!jwtPayload || jwtPayload.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query conditions
    let conditions = [eq(creditConsumptionLogs.userId, userId)];

    if (fromDate) {
      conditions.push(gte(creditConsumptionLogs.createdAt, new Date(fromDate)));
    }

    if (toDate) {
      // Add one day to include the entire end date
      const endDate = new Date(toDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(creditConsumptionLogs.createdAt, endDate));
    }

    if (model) {
      conditions.push(eq(creditConsumptionLogs.model, model));
    }

    if (workflowId) {
      conditions.push(
        eq(creditConsumptionLogs.workflowDefinitionId, workflowId)
      );
    }

    // Get user's credit usage history with workflow names
    const usageHistory = await db
      .select({
        id: creditConsumptionLogs.id,
        model: creditConsumptionLogs.model,
        creditsConsumed: creditConsumptionLogs.creditsConsumed,
        workflowDefinitionId: creditConsumptionLogs.workflowDefinitionId,
        workflowName: workflowDefinitions.name,
        createdAt: creditConsumptionLogs.createdAt,
        type:
          userType === 'publisher'
            ? sql`'subscription_income'`
            : sql`'subscription_deduction'`
      })
      .from(creditConsumptionLogs)
      .leftJoin(
        workflowDefinitions,
        and(
          eq(
            creditConsumptionLogs.workflowDefinitionId,
            workflowDefinitions.workflowDefinitionId
          ),
          eq(creditConsumptionLogs.userId, workflowDefinitions.userId)
        )
      )
      .where(and(...conditions))
      .orderBy(desc(creditConsumptionLogs.createdAt))
      .limit(100);

    // Get unique models and workflows for filters
    const uniqueModels = await db
      .selectDistinct({ model: creditConsumptionLogs.model })
      .from(creditConsumptionLogs)
      .where(eq(creditConsumptionLogs.userId, userId));

    const uniqueWorkflows = await db
      .selectDistinct({
        id: creditConsumptionLogs.workflowDefinitionId,
        name: workflowDefinitions.name
      })
      .from(creditConsumptionLogs)
      .leftJoin(
        workflowDefinitions,
        and(
          eq(
            creditConsumptionLogs.workflowDefinitionId,
            workflowDefinitions.workflowDefinitionId
          ),
          eq(creditConsumptionLogs.userId, workflowDefinitions.userId)
        )
      )
      .where(
        and(
          eq(creditConsumptionLogs.userId, userId),
          isNotNull(creditConsumptionLogs.workflowDefinitionId)
        )
      );

    return NextResponse.json({
      usageHistory,
      filters: {
        models: uniqueModels.map((m) => m.model),
        workflows: uniqueWorkflows
      }
    });
  } catch (error) {
    console.error('Error fetching credit usage history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit usage history' },
      { status: 500 }
    );
  }
}
