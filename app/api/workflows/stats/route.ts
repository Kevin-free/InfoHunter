import { NextResponse } from 'next/server';
import { CreditService } from '@/lib/services/creditService';
import { verifyJWT } from '@/lib/jwt';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtSub = await verifyJWT(token || '');

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalWorkflows, usedWorkflows] = await Promise.all([
      CreditService.getUserWorkflows(jwtSub.userId),
      CreditService.getWorkflowsCount(jwtSub.userId)
    ]);

    return NextResponse.json({
      totalWorkflows,
      usedWorkflows
    });
  } catch (error) {
    console.error('Failed to fetch workflow stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow stats' },
      { status: 500 }
    );
  }
}
