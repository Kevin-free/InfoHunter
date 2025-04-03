import { db, userCredits } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('payment-callback body', body);

    const order = body.data?.order;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 400 });
    }

    const userId = order.payer_id;
    const amount = order.original_amount;

    // await db
    //   .update(userCredits)
    //   .set({
    //     credits: sql`credits + ${amount}`
    //   })
    //   .where(eq(userCredits.userId, userId));

    return NextResponse.json(
      {
        success: true,
        message: 'Payment callback processed successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing payment callback:', error);
    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process payment callback'
      },
      { status: 500 }
    );
  }
}
