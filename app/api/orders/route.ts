import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/services/orderService';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    console.log('--- /api/orders body', orderData);

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtPayload = await verifyJWT(token || '');

    if (!jwtPayload || jwtPayload.userId !== orderData.payer_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderService = new OrderService();
    const result = await orderService.createOrder(orderData);

    return NextResponse.json({ success: true, order: result });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
