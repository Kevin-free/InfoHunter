'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DataWorkflowValue,
  DataWorkflowValueWithChat,
  WorkflowValueHistoryProps
} from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ValueDetailDialog } from './value-detail-dialog';
import { GroupAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Rename the component to WorkflowValueHistory
export function WorkflowValueHistory({
  values,
  isGroupValues,
  dataWorkflowDefinitionName
}: WorkflowValueHistoryProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedValue, setSelectedValue] = useState<
    DataWorkflowValue | DataWorkflowValueWithChat | null
  >(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!values.length) return null;

  const downloadAsMarkdown = (
    value: DataWorkflowValue | DataWorkflowValueWithChat
  ) => {
    const isGroupValue = isGroupValues && 'chatName' in value;
    const timestamp = new Date(value.updatedAt).toISOString().split('T')[0];
    const fileName = isGroupValue
      ? `${dataWorkflowDefinitionName}-${(value as DataWorkflowValueWithChat).chatName || 'group'}-v${value.version}-${timestamp}.md`
      : `${dataWorkflowDefinitionName}-aggregate-v${value.version}-${timestamp}.md`;

    let content = `# Data Workflow Value - Version ${value.version}\n\n`;
    content += `Updated: ${formatDateTime(value.updatedAt)}\n\n`;

    if (isGroupValue) {
      content += `## Group Information\n`;
      content += `- Group Name: ${(value as DataWorkflowValueWithChat).chatName || 'Unnamed Group'}\n`;
      content += `- Members: ${(value as DataWorkflowValueWithChat).participantsCount}\n\n`;
    }

    content += `## Details\n\n`;
    content += `### Value\n${value.value}\n\n`;
    content += `### Confidence\n${value.confidence}%\n\n`;
    content += `### Reason\n${value.reason}\n`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 获取状态徽章的样式
  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'pending':
      default:
        return 'outline';
    }
  };

  const renderValueCard = (
    value: DataWorkflowValue | DataWorkflowValueWithChat,
    isLatest: boolean = false
  ) => {
    const isGroupValue = isGroupValues && 'chatName' in value;
    // 默认状态为"pending"，如果未定义
    const status = value.status || 'pending';

    return (
      <Card
        key={value.id}
        className="mb-4 group cursor-pointer hover:bg-accent/5 transition-colors"
        onClick={() => {
          setSelectedValue(value);
          setDialogOpen(true);
        }}
      >
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            {/* 添加状态徽章 */}
            <Badge
              variant={getStatusBadgeVariant(status)}
              className={`shrink-0 ${
                status.toLowerCase() === 'completed'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : status.toLowerCase() === 'processing'
                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                    : status.toLowerCase() === 'failed'
                      ? ''
                      : ''
              }`}
            >
              {status}
            </Badge>

            <div className="flex-1 min-w-0">
              {isGroupValue && (
                <div className="flex items-center gap-3 mb-3">
                  <GroupAvatar
                    photo={(value as DataWorkflowValueWithChat).chatPhoto || ''}
                    name={(value as DataWorkflowValueWithChat).chatName || ''}
                    size={32}
                    is_r2_url={true}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
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
              <div className="flex items-center gap-4">
                <div className="text-sm">Confidence: {value.confidence}%</div>
                <div className="text-xs text-muted-foreground">
                  Updated: {formatDateTime(value.updatedAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className={`${isLatest ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedValue(value);
                  setDialogOpen(true);
                }}
              >
                View Detail
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`${isLatest ? '' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAsMarkdown(value);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {values[0].map((value) => renderValueCard(value, true))}
      </div>

      {values.length > 1 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? '' : 'transform -rotate-90'
                }`}
              />
              HISTORY ({values.length - 1} versions)
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {values.slice(1).map((versionValues, index) => (
              <div key={index} className="space-y-4">
                {versionValues.map((value) => renderValueCard(value))}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      <ValueDetailDialog
        value={selectedValue}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        isGroupValue={isGroupValues}
      />
    </div>
  );
}
