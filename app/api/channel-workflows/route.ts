import { verifyJWT } from '@/lib/jwt';
import { channelWorkflows, db } from '@/lib/schema';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelIds, workflowIds } = await request.json();

    if (!Array.isArray(channelIds) || !Array.isArray(workflowIds)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Create all possible combinations
    const values = channelIds
      .map((channelId) =>
        workflowIds.map((workflowId) => ({
          channelId,
          workflowDefinitionId: workflowId,
          workflowValueId: ''
        }))
      )
      .flat();

    // Use INSERT ... ON CONFLICT DO NOTHING to handle duplicates
    await db.transaction(async (trx) => {
      for (const value of values) {
        await trx
          .insert(channelWorkflows)
          .values(value)
          .onConflictDoNothing({
            target: [
              channelWorkflows.channelId,
              channelWorkflows.workflowDefinitionId
            ]
          });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in channel-workflows POST:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
