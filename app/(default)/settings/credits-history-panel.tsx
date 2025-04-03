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
import { Loader2, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getJwt } from '@/components/lib/networkUtils';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { CalendarDate } from '@internationalized/date';

interface CreditUsage {
  id: number;
  model: string;
  creditsConsumed: string;
  workflowDefinitionId?: string;
  workflowName?: string;
  createdAt: string;
  type: 'subscription_deduction' | 'subscription_income';
}

interface CreditsUsageHistoryPanelProps {
  userId: string | undefined;
}

export function CreditsUsageHistoryPanel({
  userId
}: CreditsUsageHistoryPanelProps) {
  const [usageHistory, setUsageHistory] = useState<CreditUsage[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<CreditUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<{
    from: CalendarDate | undefined;
    to: CalendarDate | undefined;
  }>({
    from: undefined,
    to: undefined
  });
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [workflowFilter, setWorkflowFilter] = useState<string>('all');

  // Unique values for filters
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [uniqueWorkflows, setUniqueWorkflows] = useState<
    { id: string; name: string }[]
  >([]);

  const fetchUsageHistory = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const token = getJwt();
      const response = await fetch(`/api/credits/usage?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch credits usage history');
      }

      const data = await response.json();
      setUsageHistory(data.usageHistory || []);

      // Extract unique model and workflow values for filters
      const models = [
        ...new Set(data.usageHistory.map((item: CreditUsage) => item.model))
      ] as string[];
      setUniqueModels(models);

      const workflows = data.usageHistory.reduce(
        (acc: { id: string; name: string }[], item: CreditUsage) => {
          if (item.workflowDefinitionId && item.workflowName) {
            const exists = acc.some((w) => w.id === item.workflowDefinitionId);
            if (!exists) {
              acc.push({
                id: item.workflowDefinitionId,
                name: item.workflowName
              });
            }
          }
          return acc;
        },
        []
      );
      setUniqueWorkflows(workflows);

      // Initialize filtered history with all history
      setFilteredHistory(data.usageHistory || []);
    } catch (err) {
      console.error('Error fetching credits usage history:', err);
      setError('Failed to load credits usage history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUsageHistory();
    }
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [usageHistory]);

  useEffect(() => {
    if (usageHistory.length > 0) {
      applyFilters();
    }
  }, [modelFilter, workflowFilter, dateRange]);

  const applyFilters = () => {
    let filtered = [...usageHistory];

    // Apply model filter
    if (modelFilter && modelFilter !== 'all') {
      filtered = filtered.filter((item) => item.model === modelFilter);
    }

    // Apply workflow filter
    if (workflowFilter && workflowFilter !== 'all') {
      filtered = filtered.filter(
        (item) => item.workflowDefinitionId === workflowFilter
      );
    }

    // Apply date filter
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from.toString());
      filtered = filtered.filter(
        (item) => new Date(item.createdAt) >= fromDate
      );
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to.toString());
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((item) => new Date(item.createdAt) <= toDate);
    }

    setFilteredHistory(filtered);
  };

  const clearFilters = () => {
    setModelFilter('all');
    setWorkflowFilter('all');
    setDateRange({ from: undefined, to: undefined });
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Credits History</CardTitle>
          <CardDescription>
            View your credits consumption history
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Filter className="h-3.5 w-3.5" />
                Filters
                {((modelFilter && modelFilter !== 'all') ||
                  (workflowFilter && workflowFilter !== 'all') ||
                  dateRange.from) && (
                  <Badge
                    variant="secondary"
                    className="ml-1 rounded-sm px-1 font-normal"
                  >
                    {
                      [
                        modelFilter && modelFilter !== 'all' && '1',
                        workflowFilter && workflowFilter !== 'all' && '1',
                        (dateRange.from || dateRange.to) && '1'
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px]">
              <div className="space-y-4">
                <h4 className="font-medium">Filter by</h4>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Date Range</h5>
                  <DatePickerWithRange
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Model</h5>
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {uniqueModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Workflow</h5>
                  <Select
                    value={workflowFilter}
                    onValueChange={setWorkflowFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Workflows</SelectItem>
                      {uniqueWorkflows.map((workflow) => (
                        <SelectItem key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsageHistory}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
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
              onClick={fetchUsageHistory}
            >
              Try Again
            </Button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No usage history found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Workflow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    {/* Negative to indicate income */}
                    <TableCell
                      className={
                        item.creditsConsumed.startsWith('-')
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {item.creditsConsumed.startsWith('-')
                        ? `+${item.creditsConsumed.substring(1)}`
                        : `-${item.creditsConsumed}`}
                    </TableCell>
                    <TableCell>
                      {item.workflowDefinitionId ? (
                        <Link
                          href={`/subscriber/workflows/${item.workflowDefinitionId}`}
                          className="text-primary underline cursor-pointer"
                        >
                          {item.workflowName || item.workflowDefinitionId}
                        </Link>
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
      </CardContent>
    </Card>
  );
}
