'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DataWorkflowValue,
  DataWorkflowValueWithChat,
  Channel
} from '@/lib/types';
import {
  ArrowLeft,
  ChevronDown,
  RotateCw,
  Edit,
  Trash,
  Play,
  Pause
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { WorkflowValueHistory } from './workflow-value-history';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { getJwt } from '@/components/lib/networkUtils';
import { toast } from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { WorkflowDialog } from '../workflow-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { WorkflowDefinition } from '@/lib/schema';
import { GroupsTable } from '../../channels/groups-table';
import { useSubscriberChannels } from '@/lib/hooks/useSubscriberChannels';
import { formatDateTime } from '@/lib/utils';
import { useWorkflowValues } from '@/lib/hooks/useWorkflowValues';

interface DataWorkflowDetailProps {
  definition: WorkflowDefinition;
  backLink: string;
  backLabel: string;
}

export function DataWorkflowDetail({
  definition,
  backLink,
  backLabel
}: DataWorkflowDetailProps) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // 使用自定义钩子获取工作流值，自动轮询
  const {
    data: workflowData,
    loading,
    error,
    mutate: refreshWorkflowData
  } = useWorkflowValues({
    workflowDefinitionId: definition.workflowDefinitionId,
    // 只有当工作流处于活动状态时才启用自动轮询
    refreshInterval: definition.status === 'active' ? 10000 : 0
  });

  const { aggregateValues, groupValues, lastUpdated } = workflowData;

  // 获取频道数据
  const {
    data: channelsData,
    loading: channelsLoading,
    mutate: mutateChannels
  } = useSubscriberChannels({
    workflowDefinitionId: definition.workflowDefinitionId
  });

  // 手动刷新数据
  const refreshData = async () => {
    try {
      await refreshWorkflowData();
      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleManualRun = async () => {
    try {
      setIsRunning(true);
      const response = await fetch(
        `/api/data-workflows/${definition.workflowDefinitionId}/process`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${getJwt()}`
          }
        }
      );

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 402) {
          toast.error('Insufficient credits! Please buy credits.');
          return;
        }
        throw new Error(data.error || 'Failed to run workflow');
      }

      toast.success('Workflow started successfully');

      // 延迟2秒后刷新数据，给后端处理的时间
      setTimeout(async () => {
        await refreshWorkflowData();
      }, 2000);
    } catch (error) {
      console.error('Failed to run workflow:', error);
      toast.error('Failed to run workflow');
    } finally {
      setIsRunning(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `/api/data-workflows/${definition.workflowDefinitionId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getJwt()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      toast.success('Workflow deleted successfully');
      // 重定向到工作流列表页面
      window.location.href = '/subscriber/workflows';
    } catch (error) {
      console.error('Error deleting workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  const handleStatusChange = async () => {
    try {
      const response = await fetch(
        `/api/data-workflows/${definition.workflowDefinitionId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          },
          body: JSON.stringify({
            status: definition.status === 'active' ? 'paused' : 'active'
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update workflow status');
      }

      // 刷新页面以显示更新的状态
      window.location.reload();
    } catch (error) {
      console.error('Error updating workflow status:', error);
      toast.error('Failed to update workflow status');
    }
  };

  // Calculate next run time based on last update and refresh interval
  const getNextRunTime = (workflow: WorkflowDefinition) => {
    const lastUpdate = workflow.updatedAt
      ? new Date(workflow.updatedAt)
      : new Date();
    const nextRun = new Date(
      lastUpdate.getTime() + workflow.refreshIntervalHours * 60 * 60 * 1000
    );
    return nextRun;
  };

  // Generate message strategy description
  const getStrategyDescription = () => {
    switch (definition.messageStrategy) {
      case 'latest_n':
        return `Pull latest ${definition.messageCount || 100} messages from each channel`;
      case 'past_time': {
        const value = definition.timeWindowValue || 24;
        const unit = definition.timeWindowUnit || 'hours';
        return `Pull messages from the past ${value} ${unit}`;
      }
      default:
        return 'No message pulling strategy specified';
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* 返回按钮 */}
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href={backLink}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStatusChange}
            disabled={isRunning}
            className="gap-2"
          >
            {definition.status === 'active' ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {definition.status === 'active' ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRun}
            disabled={isRunning}
            className="gap-2"
          >
            <RotateCw
              className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`}
            />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{definition.name}</CardTitle>
            {/* <Badge
              variant="outline"
              className={`mt-1 ${definition.status === 'active' ? 'bg-[#E8FFF3] text-[#16B364] border-[#E8FFF3]' : 'bg-[#FFE8E8] text-[#F43F5E] border-[#FFE8E8]'} rounded-full px-2 py-0.5 text-xs font-medium w-fit`}
            >
              {definition.status === 'active' ? 'Running' : 'Paused'}
            </Badge> */}
            <Badge
              variant="outline"
              className={`mt-1 ${!definition.isPrivate ? 'bg-[#E8FFF3] text-[#16B364] border-[#E8FFF3]' : 'bg-[#FFE8E8] text-[#F43F5E] border-[#FFE8E8]'} rounded-full px-2 py-0.5 text-xs font-medium w-fit`}
            >
              {definition.isPrivate ? 'Private' : 'Public'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Model</div>
              <div className="mt-1 text-sm">{definition.model}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Refresh Interval
              </div>
              <div className="mt-1 text-sm">
                {definition.refreshIntervalHours} hours
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Run</div>
              <div className="mt-1 text-sm">
                {formatDateTime(definition.updatedAt)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Next Run</div>
              <div className="mt-1 text-sm">
                {formatDateTime(getNextRunTime(definition))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Collapsible
              open={isPromptOpen}
              onOpenChange={setIsPromptOpen}
              className="space-y-2"
            >
              <div className="flex items-center">
                <h4 className="text-sm text-muted-foreground">Group Prompt</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isPromptOpen ? '' : 'transform -rotate-90'
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-sm max-h-[200px] overflow-y-auto">
                      <ReactMarkdown>{definition.prompt}</ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Display strategy information */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Message Pulling Strategy</h3>
        <div className="bg-gray-50 p-3 rounded-md">
          <p>{getStrategyDescription()}</p>
        </div>
      </div>

      <Tabs defaultValue="channel-list">
        <TabsList>
          <TabsTrigger value="channel-list">Channels</TabsTrigger>
          <TabsTrigger value="aggregate-result">Aggregate Result</TabsTrigger>
        </TabsList>

        <TabsContent value="channel-list" className="mt-4">
          {channelsLoading ? (
            <div className="flex items-center justify-center p-4">
              <RotateCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <>
              <GroupsTable
                chats={channelsData?.chats || []}
                offset={0}
                totalChats={channelsData?.totalChats || 0}
                pageSize={20}
                showCheckboxes={true}
                columns={[
                  'Name',
                  'Intro',
                  'Members',
                  'Messages',
                  'Publisher',
                  'Pricing',
                  'Last Synced',
                  'Last Message'
                ]}
                basePath="/subscriber/channels"
                filterPath={`/subscriber/workflows/${definition.workflowDefinitionId}`}
                onItemClick={(chatId) => `/subscriber/channels/${chatId}`}
                showDeleteAction={true}
                mutate={mutateChannels}
                onChannelsSelected={setSelectedChannels}
                selectedChannels={selectedChannels}
                currentTab={definition.workflowDefinitionId}
              />
            </>
          )}
        </TabsContent>

        <TabsContent value="aggregate-result" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <RotateCw className="h-6 w-6 animate-spin" />
            </div>
          ) : aggregateValues.length > 0 ? (
            <WorkflowValueHistory
              values={aggregateValues}
              isGroupValues={false}
              dataWorkflowDefinitionName={definition.name}
            />
          ) : (
            <div>No aggregate result found</div>
          )}
        </TabsContent>
      </Tabs>

      <WorkflowDialog
        mode="edit"
        workflow={definition}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Are you sure you want to delete this workflow?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              workflow and all its data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
