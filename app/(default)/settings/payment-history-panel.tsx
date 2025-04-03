'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getJwt } from '@/components/lib/networkUtils';
import { Pagination } from '@/components/ui/pagination';

interface Payment {
  id: number;
  credits: string;
  realAmount: string;
  status: string;
  chain: string;
  txHash?: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentHistoryPanelProps {
  userId: string | undefined;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function PaymentHistoryPanel({ userId }: PaymentHistoryPanelProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });

  const fetchPaymentHistory = async (page = pagination.page) => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const token = getJwt();
      const response = await fetch(
        `/api/orders/history?userId=${userId}&page=${page}&pageSize=${pagination.pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.payments || []);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory(1);
  }, [userId]);

  const handlePageChange = (page: number) => {
    fetchPaymentHistory(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: newPageSize,
      page: 1
    }));
    fetchPaymentHistory(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <Badge variant="default">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View your credit purchase history
            {lastRefreshed && (
              <span className="text-xs text-muted-foreground ml-2">
                Last updated: {formatDate(lastRefreshed.toISOString())}
              </span>
            )}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => fetchPaymentHistory(pagination.page)}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-6 text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchPaymentHistory(pagination.page)}
            >
              Try Again
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No payment history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Chain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paidAt
                        ? formatDate(payment.paidAt)
                        : formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>{payment.credits}</TableCell>
                    <TableCell>{payment.chain}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell>
                      {payment.txHash ? (
                        <a
                          href={`https://etherscan.io/tx/${payment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
              pageSize={pagination.pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
