import { verifyJWT } from '@/lib/jwt';
import { OrderService } from '@/lib/services/orderService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get userId from query params
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const jwtPayload = await verifyJWT(token || '');

  if (!jwtPayload || jwtPayload.userId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orderService = new OrderService();
    const { orders: orderHistory, total } =
      await orderService.getUserOrderHistory(userId, { page, pageSize });

    // Map database results to expected frontend format
    const payments = orderHistory.map((order) => ({
      id: order.id,
      credits: order.credits,
      realAmount: order.originalAmount.toString(),
      status: order.status,
      chain: getChainName(order.chainId),
      txHash: order.transferHash,
      createdAt: order.createdAt,
      paidAt: order.finishTimestamp
        ? new Date(order.finishTimestamp * 1000).toISOString()
        : undefined
    }));

    return NextResponse.json({
      payments,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}

// Helper function to map chain IDs to readable names
function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    84532: 'Base' // Based on the payment code that shows 84532
  };

  return chains[chainId] || `Chain ${chainId}`;
}
