'use client';

import { useQuery } from '@tanstack/react-query';
import { useUserStore } from 'stores/userStore';

export const PaymentHistory = () => {
  const user = useUserStore((state) => state.user);
  const paymentServiceUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;
  const paymentServiceApplicationId = 'curifi';

  const userOrdersQuery = useQuery({
    queryKey: ['payment-user-orders', user?.userId],
    enabled: !!user?.userId && !!paymentServiceUrl,
    queryFn: async () => {
      if (!user?.userId || !paymentServiceUrl) {
        return [];
      }

      try {
        const resJson = await fetch(
          `${paymentServiceUrl}/user-orders?payerId=${user.userId}&applicationId=${paymentServiceApplicationId}`
        ).then((res) => res.json());

        return resJson?.data?.orders || [];
      } catch (error) {
        console.error('Error fetching user orders:', error);
        return [];
      }
    }
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Payment History
      </h2>
      <div className="space-y-6">
        <div className="flex items-center">
          <div className="flex-1">OrderId</div>
          <div className="flex-1">Amount</div>
          <div className="flex-1">Status</div>
        </div>
        {/* Transactions */}
        {userOrdersQuery.data?.map(
          (order: {
            id: string;
            transfer_amount_on_chain: string;
            status: number;
          }) => (
            <div key={order.id} className="flex items-center">
              <div className="flex-1">{order.id}</div>
              <div className="flex-1">
                {Number(order.transfer_amount_on_chain) / Math.pow(10, 6)}
              </div>
              <div className="flex-1">
                {order.status === 0 ? 'Ongoing' : 'Completed'}
              </div>
            </div>
          )
        )}

        {userOrdersQuery.data?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No payment history yet
          </div>
        )}
      </div>
    </div>
  );
};
