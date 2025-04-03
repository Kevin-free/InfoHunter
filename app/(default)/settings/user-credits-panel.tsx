'use client';

import { useUserCredits } from 'hooks/useUserCredits';
import { PaymentModal } from '@/components/shared/PaymentModal';
import { WorkflowPackageModal } from '@/components/shared/WorkflowPackageModal';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Loader2, CreditCard, Workflow } from 'lucide-react';
import { getJwt } from '@/components/lib/networkUtils';

interface UserCreditsPanelProps {
  userId: string | undefined;
}

export function UserCreditsPanel({ userId }: UserCreditsPanelProps) {
  const { credits, loading, refreshCredits } = useUserCredits(userId);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [buyWorkflowsOpen, setBuyWorkflowsOpen] = useState(false);
  const [workflowStats, setWorkflowStats] = useState({
    total: 0,
    used: 0,
    loading: true
  });

  useEffect(() => {
    if (userId) {
      fetchWorkflowStats();
    }
  }, [userId]);

  const fetchWorkflowStats = async () => {
    try {
      setWorkflowStats((prev) => ({ ...prev, loading: true }));
      const response = await fetch('/api/workflows/stats', {
        headers: {
          Authorization: `Bearer ${getJwt()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workflow stats');
      }

      const data = await response.json();
      setWorkflowStats({
        total: data.totalWorkflows,
        used: data.usedWorkflows,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching workflow stats:', error);
      setWorkflowStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleWorkflowPurchaseSuccess = () => {
    setBuyWorkflowsOpen(false);
    fetchWorkflowStats();
    refreshCredits();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
          <CardDescription>
            Manage your credits balance and purchases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h3 className="text-lg font-medium">Current Balance</h3>
                <p className="text-sm text-muted-foreground">
                  Available credits for API usage
                </p>
              </div>
              <div className="text-xl font-bold">
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span>{credits}</span>
                )}
              </div>
            </div>

            <Button
              variant="default"
              className="w-full md:w-auto"
              onClick={() => setBuyCreditsOpen(true)}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </div>

          <PaymentModal
            isOpen={buyCreditsOpen}
            onClose={() => setBuyCreditsOpen(false)}
            onSuccess={() => {
              setBuyCreditsOpen(false);
              refreshCredits();
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workflow Packages</CardTitle>
          <CardDescription>
            Upgrade your workflow capacity and automation capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h3 className="text-lg font-medium">Workflow Slots</h3>
                <p className="text-sm text-muted-foreground">
                  Available workflow slots for your account
                </p>
              </div>
              <div className="text-xl font-bold">
                {workflowStats.loading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <span>
                    {workflowStats.used} / {workflowStats.total}
                  </span>
                )}
              </div>
            </div>

            <Button
              variant="default"
              className="w-full md:w-auto"
              onClick={() => setBuyWorkflowsOpen(true)}
            >
              <Workflow className="mr-2 h-4 w-4" />
              Buy Workflow Packages
            </Button>
          </div>

          <WorkflowPackageModal
            isOpen={buyWorkflowsOpen}
            onClose={() => setBuyWorkflowsOpen(false)}
            onSuccess={handleWorkflowPurchaseSuccess}
            currentCredits={credits}
          />
        </CardContent>
      </Card>
    </div>
  );
}
