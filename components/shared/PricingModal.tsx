import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (isFree: boolean, subscriptionFee: number) => void;
  onCancel: () => void;
  initialIsFree?: boolean;
  initialSubscriptionFee?: string;
}

export function PricingModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  initialIsFree = true,
  initialSubscriptionFee = '0'
}: PricingModalProps) {
  const [isFree, setIsFree] = useState(initialIsFree);
  const [subscriptionFee, setSubscriptionFee] = useState<string>(
    initialSubscriptionFee
  );

  const handleConfirm = () => {
    onConfirm(isFree, isFree ? 0 : parseFloat(subscriptionFee));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Channel Pricing Settings</DialogTitle>
          <DialogDescription>
            Set pricing options for the selected channels.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="is-free" className="text-right">
              Free Access
            </Label>
            <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
          </div>
          {!isFree && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="subscription-fee"
                className="text-right col-span-2"
              >
                Usage Fee
              </Label>
              <div className="col-span-2 flex items-center">
                <Input
                  id="subscription-fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={subscriptionFee}
                  onChange={(e) => setSubscriptionFee(e.target.value)}
                  className="col-span-2"
                />
                <span className="ml-2">Credits</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
