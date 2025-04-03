'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowDefinition } from '@/lib/schema';
import { getJwt } from '@/components/lib/networkUtils';
import { toast } from 'react-hot-toast';

interface AddToWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedChannels: string[];
  onComplete: () => void;
}

export function AddToWorkflowDialog({
  open,
  onOpenChange,
  selectedChannels,
  onComplete
}: AddToWorkflowDialogProps) {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await fetch('/api/data-workflows', {
          headers: {
            Authorization: `Bearer ${getJwt()}`
          }
        });
        const data = await response.json();
        setWorkflows(data.result || []);
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
        toast.error('Failed to fetch workflows');
      }
    };

    if (open) {
      fetchWorkflows();
      setSelectedWorkflows([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (selectedWorkflows.length === 0) {
      toast.error('Please select at least one workflow');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/channel-workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({
          channelIds: selectedChannels,
          workflowIds: selectedWorkflows
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add workflows');
      }

      toast.success('Successfully added to workflows');
      onComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to workflows:', error);
      toast.error('Failed to add to workflows');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Workflows</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[300px] mt-4">
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.workflowDefinitionId}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={selectedWorkflows.includes(
                    workflow.workflowDefinitionId
                  )}
                  onCheckedChange={(checked) => {
                    setSelectedWorkflows(
                      checked
                        ? [...selectedWorkflows, workflow.workflowDefinitionId]
                        : selectedWorkflows.filter(
                            (id) => id !== workflow.workflowDefinitionId
                          )
                    );
                  }}
                />
                <div>
                  <p className="font-medium">{workflow.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Refresh every {workflow.refreshIntervalHours} hours
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
