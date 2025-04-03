'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { DataWorkflowValueWithChat, ValueDetailDialogProps } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { GroupAvatar } from '@/components/ui/avatar';

export function ValueDetailDialog({
  value,
  open,
  onOpenChange,
  isGroupValue
}: ValueDetailDialogProps) {
  if (!value) return null;

  const isGroupValueWithChat = isGroupValue && 'chatName' in value;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Version {value.version} Details</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-6 -mr-6">
          <div className="space-y-4">
            {isGroupValueWithChat && (
              <div className="flex items-center gap-3 mb-3">
                <GroupAvatar
                  photo={(value as DataWorkflowValueWithChat).chatPhoto || ''}
                  name={(value as DataWorkflowValueWithChat).chatName || ''}
                  size={32}
                  is_r2_url={true}
                />
                <div>
                  <div className="text-sm font-medium">
                    {(value as DataWorkflowValueWithChat).chatName ||
                      'Unnamed Group'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(value as DataWorkflowValueWithChat).participantsCount}{' '}
                    members
                  </div>
                </div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Value</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">
                <ReactMarkdown>{value.value}</ReactMarkdown>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Confidence</div>
              <div className="mt-1 text-sm">{value.confidence}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Reason</div>
              <div className="mt-1 text-sm whitespace-pre-wrap">
                <ReactMarkdown>{value.reason}</ReactMarkdown>
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Updated</div>
              <div className="mt-1 text-sm">
                {formatDateTime(value.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
