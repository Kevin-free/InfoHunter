import { db } from '@/lib/schema';
import { sql, eq, desc } from 'drizzle-orm';
import { orders, userCredits } from '@/lib/schema';

interface CreateOrderParams {
  id: string;
  chain_id: number;
  original_amount: number;
  token_decimals: number;
  token_address: string;
  original_amount_on_chain: string;
  transfer_amount_on_chain: string;
  transfer_address: string;
  transfer_hash: string;
  application_id: string;
  payer_id: string;
  status: number;
  create_timestamp: number;
}

interface UpdateOrderParams {
  external_order_id: string;
  status: number;
  transfer_hash?: string;
  finish_timestamp?: number;
}

export class OrderService {
  /**
   * 创建订单记录
   */
  async createOrder(orderData: CreateOrderParams) {
    // 将数字状态转换为有意义的字符串
    const statusMap: Record<number, string> = {
      0: 'pending',
      1: 'success',
      2: 'failed',
      3: 'cancelled',
      4: 'expired'
    };

    // 使用原始金额作为积分金额（1:1比例）
    const credits = orderData.original_amount;

    return await db
      .insert(orders)
      .values({
        userId: orderData.payer_id,
        chainId: orderData.chain_id,
        originalAmount: orderData.original_amount.toString(),
        tokenDecimals: orderData.token_decimals,
        tokenAddress: orderData.token_address,
        originalAmountOnChain: orderData.original_amount_on_chain,
        transferAmountOnChain: orderData.transfer_amount_on_chain,
        transferAddress: orderData.transfer_address,
        transferHash: orderData.transfer_hash || null,
        applicationId: orderData.application_id,
        status: statusMap[orderData.status] || 'pending',
        createTimestamp: orderData.create_timestamp,
        finishTimestamp: null,
        externalOrderId: orderData.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        credits: credits.toString()
      })
      .returning();
  }

  /**
   * 更新订单状态
   */
  async updateOrderStatus(params: UpdateOrderParams) {
    return await db.transaction(async (tx) => {
      // 获取订单信息
      const [order] = await tx
        .select()
        .from(orders)
        .where(eq(orders.externalOrderId, params.external_order_id))
        .limit(1);

      if (!order) {
        throw new Error(`Order not found: ${params.external_order_id}`);
      }

      // 将状态码转换为文本状态
      const statusMap: Record<number, string> = {
        0: 'pending',
        1: 'success',
        2: 'failed',
        3: 'cancelled',
        4: 'expired'
      };
      const orderStatus = statusMap[params.status] || 'pending';

      // 如果订单已经是终态，直接返回
      if (
        ['success', 'failed', 'cancelled', 'expired'].includes(order.status) &&
        order.status !== 'pending'
      ) {
        console.log(
          `Order ${params.external_order_id} already processed, status: ${order.status}`
        );
        return order;
      }

      // 更新订单状态
      await tx
        .update(orders)
        .set({
          status: orderStatus,
          transferHash: params.transfer_hash || order.transferHash,
          finishTimestamp: params.finish_timestamp || order.finishTimestamp,
          updatedAt: new Date()
        })
        .where(eq(orders.externalOrderId, params.external_order_id));

      // 如果支付成功，更新用户积分
      if (orderStatus === 'success') {
        await tx
          .insert(userCredits)
          .values({
            userId: order.userId,
            credits: order.credits,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: userCredits.userId,
            set: {
              credits: sql`${userCredits.credits} + ${order.credits}`,
              updatedAt: new Date()
            }
          });

        console.log(
          `Credits added for user ${order.userId}: +${order.credits}`
        );
      }

      // 获取更新后的订单
      const [updatedOrder] = await tx
        .select()
        .from(orders)
        .where(eq(orders.externalOrderId, params.external_order_id))
        .limit(1);

      return updatedOrder;
    });
  }

  /**
   * 获取用户订单历史
   */
  async getUserOrderHistory(
    userId: string,
    options = { page: 1, pageSize: 10 }
  ) {
    const { page, pageSize } = options;
    const offset = (page - 1) * pageSize;

    // Get total count for pagination
    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(orders)
      .where(eq(orders.userId, userId));

    const total = Number(totalResult[0]?.count || 0);

    const orderHistory = await db
      .select({
        id: orders.id,
        credits: orders.credits,
        originalAmount: orders.originalAmount,
        chainId: orders.chainId,
        status: orders.status,
        transferHash: orders.transferHash,
        createdAt: orders.createdAt,
        finishTimestamp: orders.finishTimestamp
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset);

    return { orders: orderHistory, total };
  }
}
