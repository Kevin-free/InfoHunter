import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from 'stores/userStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderService } from '@/lib/services/orderService';
import { getJwt } from '../lib/networkUtils';

const paymentServiceUrl = process.env.NEXT_PUBLIC_PAYMENT_SERVICE_URL;
const paymentServiceApplicationId = 'curifi';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess
}: PaymentModalProps) => {
  const [amount, setAmount] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const user = useUserStore((state) => state.user);
  const isAmountValid = amount !== undefined && amount >= 5;

  const ongoingOrderQuery = useQuery({
    queryKey: ['payment-user-ongoing-order', user?.userId],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const resJson = await fetch(
        `${paymentServiceUrl}/user-ongoing-order?payerId=${user?.userId}&applicationId=${paymentServiceApplicationId}`
      ).then((res) => res.json());

      return resJson?.data?.order;
    }
  });

  useEffect(() => {
    ongoingOrderQuery.refetch();
  }, [isOpen]);

  // Reset copy states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCopiedAddress(false);
      setCopiedAmount(false);
    }
  }, [isOpen]);

  const copyToClipboard = async (text: string, type: 'address' | 'amount') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(true);
        setTimeout(() => setCopiedAddress(false), 2000);
      } else {
        setCopiedAmount(true);
        setTimeout(() => setCopiedAmount(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // TODO pay use APT
  const createOrder = async () => {
    if (!isAmountValid) {
      setError('Amount must be at least 5');
      return;
    }

    setIsSubmitting(true);
    try {
      const resJson = await fetch(`${paymentServiceUrl}/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        // 56: BSC
        body: JSON.stringify({
          chainId: 56,
          amount: amount,
          payerId: user?.userId,
          applicationId: paymentServiceApplicationId
        })
      }).then((res) => res.json());

      if (resJson.status === 0 && resJson.data?.order) {
        // 将订单保存到数据库
        await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          },
          body: JSON.stringify(resJson.data.order)
        });
      }

      ongoingOrderQuery.refetch();
      setError(null);
    } catch (err) {
      console.error('Failed to create order:', err);
      setError('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkOrder = async (orderId: string) => {
    try {
      const resJson = await fetch(
        `${paymentServiceUrl}/order-detail?orderId=${orderId}`
      ).then((res) => res.json());

      if (resJson.data?.order) {
        // 更新订单状态
        await fetch('/api/orders/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          },
          body: JSON.stringify({
            payer_id: resJson.data.order.payer_id,
            external_order_id: resJson.data.order.id,
            status: resJson.data.order.status, // 0: pending, 1: success, 2: failed, 3: cancelled, 4: expired
            transfer_hash: resJson.data.order.transfer_hash,
            finish_timestamp: resJson.data.order.finish_timestamp
          })
        });

        if (resJson.data.order.status === 1) {
          setError(null);
          onSuccess();
        } else {
          setError('Order is not paid');
        }
      } else {
        setError('Failed to check order status');
      }
    } catch (err) {
      console.error('Failed to check order:', err);
      setError('Failed to check order status');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setIsCancelling(true);
      const resJson = await fetch(`${paymentServiceUrl}/cancel-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId
        })
      }).then((res) => res.json());

      if (resJson.status === 0) {
        // update order status to cancelled
        await fetch('/api/orders/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          },
          body: JSON.stringify({
            payer_id: resJson.data.order.payer_id,
            external_order_id: resJson.data.order.id,
            status: 3 // cancelled
          })
        });
        onClose();
      } else {
        setError(resJson.message || 'Failed to cancel order');
      }
    } catch (err) {
      setError('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Enter the amount of Token you would like to pay.
          </p>

          <div className="space-y-4">
            {/* Quick amount options */}
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={() => setAmount(5)}
                className="py-6"
              >
                $5
              </Button>
              <Button
                variant="outline"
                onClick={() => setAmount(10)}
                className="py-6"
              >
                $10
              </Button>
              <Button
                variant="outline"
                onClick={() => setAmount(20)}
                className="py-6"
              >
                $20
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-sm font-medium">$</span>
                </div>
                <Input
                  type="number"
                  id="amount"
                  placeholder="Please enter the recharge amount, at least $5"
                  value={amount === undefined ? '' : amount}
                  min={5}
                  onChange={(e) => {
                    const val =
                      e.target.value === ''
                        ? undefined
                        : Number(e.target.value);
                    setAmount(val);
                  }}
                  className="pl-8 pr-16"
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none bg-gradient-to-r from-primary/80 to-primary rounded-r-md">
                  <span className="text-sm font-medium text-primary-foreground">
                    USDT
                  </span>
                </div>
              </div>
              {amount !== undefined && amount < 5 && (
                <p className="text-sm text-red-500">
                  Custom amount must be at least $5
                </p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {ongoingOrderQuery.data ? (
              <Card>
                <CardContent className="pt-6">
                  <Alert className="mb-4">
                    <AlertDescription>
                      You have an ongoing order. Please complete it before
                      paying again.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Transfer Address</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 px-2 text-muted-foreground hover:text-foreground',
                            copiedAddress && 'text-green-500'
                          )}
                          onClick={() =>
                            copyToClipboard(
                              ongoingOrderQuery.data.transfer_address,
                              'address'
                            )
                          }
                        >
                          {copiedAddress ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded-md break-all">
                        {ongoingOrderQuery.data.transfer_address}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Transfer Amount</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            'h-8 px-2 text-muted-foreground hover:text-foreground',
                            copiedAmount && 'text-green-500'
                          )}
                          onClick={() =>
                            copyToClipboard(
                              String(
                                Number(
                                  ongoingOrderQuery.data
                                    .transfer_amount_on_chain
                                ) /
                                  Math.pow(
                                    10,
                                    ongoingOrderQuery.data.token_decimals
                                  )
                              ),
                              'amount'
                            )
                          }
                        >
                          {copiedAmount ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm font-mono bg-muted p-2 rounded-md">
                        {Number(
                          ongoingOrderQuery.data.transfer_amount_on_chain
                        ) /
                          Math.pow(
                            10,
                            ongoingOrderQuery.data.token_decimals
                          )}{' '}
                        USDT
                      </p>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        disabled={isSubmitting || isCancelling}
                        onClick={() => checkOrder(ongoingOrderQuery.data.id)}
                      >
                        I have paid
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => cancelOrder(ongoingOrderQuery.data.id)}
                        disabled={isCancelling || isSubmitting}
                      >
                        {isCancelling ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  disabled={isSubmitting || !isAmountValid}
                  onClick={createOrder}
                >
                  {isSubmitting ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
