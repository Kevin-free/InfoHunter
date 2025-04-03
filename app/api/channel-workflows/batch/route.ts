import { verifyJWT } from '@/lib/jwt';
import { channelWorkflows, db } from '@/lib/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelIds, workflowDefinitionId } = await request.json();

    if (!Array.isArray(channelIds) || !workflowDefinitionId) {
      return NextResponse.json(
        { error: 'Invalid input parameters' },
        { status: 400 }
      );
    }

    // Delete the channel-workflow associations
    await db
      .delete(channelWorkflows)
      .where(
        and(
          inArray(channelWorkflows.channelId, channelIds),
          eq(channelWorkflows.workflowDefinitionId, workflowDefinitionId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in channel-workflows batch DELETE:', error);
    return NextResponse.json(
      { error: 'Failed to remove channels from workflow' },
      { status: 500 }
    );
  }
}
