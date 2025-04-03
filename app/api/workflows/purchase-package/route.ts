import { NextResponse } from 'next/server';
import { CreditService } from '@/lib/services/creditService';
import { verifyJWT } from '@/lib/jwt';
import { WORKFLOW_PACKAGES } from '@/lib/constants/plans';

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtSub = await verifyJWT(token || '');

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = jwtSub.userId;
    const { packageId, creditCost, workflowCount } = await request.json();

    // Validate the package
    const packageExists = WORKFLOW_PACKAGES.find((pkg) => pkg.id === packageId);
    if (!packageExists) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    // Check if user has enough credits
    const userCredits = await CreditService.getUserCredit(userId);
    if (userCredits < creditCost) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Process the purchase
    await CreditService.purchaseWorkflowPackage(
      userId,
      creditCost,
      workflowCount
    );

    return NextResponse.json({
      success: true,
      message: 'Workflow package purchased successfully'
    });
  } catch (error) {
    console.error('Failed to purchase workflow package:', error);
    return NextResponse.json(
      { error: 'Failed to purchase workflow package' },
      { status: 500 }
    );
  }
}
