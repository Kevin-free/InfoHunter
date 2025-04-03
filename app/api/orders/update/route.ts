import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/orderService';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const updateData = await request.json();
    console.log('--- /api/orders/update body', updateData);

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtPayload = await verifyJWT(token || '');

    if (!jwtPayload || jwtPayload.userId !== updateData.payer_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const orderService = new OrderService();
    const result = await orderService.updateOrderStatus(updateData);

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
