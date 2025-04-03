'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WORKFLOW_PACKAGES } from '@/lib/constants/plans';
import { getJwt } from '@/components/lib/networkUtils';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WorkflowPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCredits: number;
}

export function WorkflowPackageModal({
  isOpen,
  onClose,
  onSuccess,
  currentCredits
}: WorkflowPackageModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (
    packageId: string,
    price: number | null,
    workflowCount: number | null
  ) => {
    if (price === null || workflowCount === null) {
      // 在新标签页中打开联系页面
      window.open('/contact', '_blank');
      onClose();
      return;
    }

    if (currentCredits < price) {
      toast.error(
        'Insufficient credits. Please purchase more credits before buying this workflow package.'
      );
      return;
    }

    try {
      setLoading(packageId);

      const response = await fetch('/api/workflows/purchase-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({
          packageId,
          creditCost: price,
          workflowCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to purchase workflow package');
      }

      toast.success(
        `You've successfully purchased ${workflowCount} workflow slots.`
      );

      onSuccess();
    } catch (error) {
      console.error('Error purchasing workflow package:', error);
      toast.error('An error occurred during the purchase. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Purchase Workflow Packages</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>Upgrade your workflow capacity with one of our packages</p>
            <p className="text-sm text-muted-foreground italic">
              *Packages do not include channel cost & AI inference cost
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 md:grid-cols-2">
          {WORKFLOW_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className="relative flex flex-col p-6 bg-white border rounded-lg shadow-sm"
            >
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{pkg.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{pkg.description}</p>
                <div className="mt-4">
                  {pkg.price !== null ? (
                    <span className="text-3xl font-bold">${pkg.price}</span>
                  ) : (
                    <span className="text-xl font-medium">Custom pricing</span>
                  )}
                  {pkg.workflowCount && (
                    <p className="text-sm text-gray-500">
                      For {pkg.workflowCount} workflows
                    </p>
                  )}
                </div>
              </div>
              <Button
                className="mt-4 w-full"
                onClick={() =>
                  handlePurchase(pkg.id, pkg.price, pkg.workflowCount)
                }
                disabled={loading !== null}
              >
                {loading === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : pkg.contactUs ? (
                  'Contact Us'
                ) : (
                  'Purchase'
                )}
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
