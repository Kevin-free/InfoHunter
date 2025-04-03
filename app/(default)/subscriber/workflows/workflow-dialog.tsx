'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { PlusCircle, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getJwt } from '@/components/lib/networkUtils';
import { WorkflowForm } from './workflow-form';
import { WorkflowDefinition } from '@/lib/schema';

interface WorkflowDialogProps {
  mode: 'add' | 'edit';
  workflow?: WorkflowDefinition;
  onWorkflowChange?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function WorkflowDialog({
  mode,
  workflow,
  onWorkflowChange,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: WorkflowDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Determine if using controlled or uncontrolled mode
  const isControlled =
    controlledOpen !== undefined && setControlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? setControlledOpen : setUncontrolledOpen;

  const handleSubmit = async (formData: any) => {
    console.log('---handleSubmit', formData);
    if (!formData.name || !formData.prompt) {
      toast.error('Workflow name and prompt are required');
      return;
    }

    setIsLoading(true);
    try {
      const url =
        mode === 'add'
          ? '/api/data-workflows'
          : `/api/data-workflows/${workflow?.workflowDefinitionId}`;

      const method = mode === 'add' ? 'POST' : 'PATCH';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({
          name: formData.name,
          prompt: formData.prompt,
          refreshIntervalHours: formData.refreshIntervalHours,
          messageStrategy: formData.messageStrategy,
          messageCount: formData.messageCount,
          timeWindowValue: formData.timeWindowValue,
          timeWindowUnit: formData.timeWindowUnit,
          isPrivate: formData.isPrivate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 处理工作流限制错误
        if (
          response.status === 403 &&
          errorData.error === 'Workflow limit reached'
        ) {
          toast.error(
            'Workflow limit reached. Please purchase more workflow slots to create additional workflows.'
          );
          setOpen(false);

          // 延迟3秒后跳转，给用户足够时间阅读提示
          setTimeout(() => {
            window.location.href = '/settings';
          }, 3000);

          return;
        }

        throw new Error(
          errorData.error ||
            `Failed to ${mode === 'add' ? 'create' : 'update'} workflow`
        );
      }

      setOpen(false);
      toast.success(
        `Workflow ${mode === 'add' ? 'created' : 'updated'} successfully`
      );

      if (onWorkflowChange) {
        onWorkflowChange();
      }

      // For edit mode, refresh the page to show updated data
      if (mode === 'edit') {
        window.location.reload();
      }
    } catch (error) {
      console.error(
        `Failed to ${mode === 'add' ? 'add' : 'update'} workflow:`,
        error
      );

      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${mode === 'add' ? 'create' : 'update'} workflow. Please try again.`;

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultTrigger =
    mode === 'add' ? (
      <Button variant="outline" size="sm" className="gap-1">
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Create Workflow
        </span>
      </Button>
    ) : (
      <Button variant="outline" size="sm">
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'New Data Workflow' : 'Edit Workflow'}
          </DialogTitle>
        </DialogHeader>
        <WorkflowForm
          initialData={
            mode === 'add'
              ? {
                  name: '',
                  prompt: '',
                  refreshIntervalHours: 0,
                  messageStrategy: 'latest_n',
                  messageCount: 100,
                  timeWindowValue: 24,
                  timeWindowUnit: 'hours',
                  isPrivate: false
                }
              : {
                  name: workflow?.name,
                  prompt: workflow?.prompt,
                  refreshIntervalHours: workflow?.refreshIntervalHours,
                  messageStrategy: workflow?.messageStrategy || 'latest_n',
                  messageCount: workflow?.messageCount || 100,
                  timeWindowValue: workflow?.timeWindowValue || 24,
                  timeWindowUnit: workflow?.timeWindowUnit || 'hours',
                  isPrivate: workflow?.isPrivate || false
                }
          }
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
