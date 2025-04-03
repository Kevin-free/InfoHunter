'use client';

import { TabsContent } from '@/components/ui/tabs';
import { GroupsTable } from './groups-table';
import { GROUP_TAB_COLUMNS } from '@/lib/types';
import { TabWrapper } from '@/components/shared/tab-wrapper';
import { GroupsGridView } from './groups-grid-view';
import { ViewStateHandler } from './view-state-handler';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { RotateCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUserStore } from 'stores/userStore';
import { useSubscriberChannels } from '@/lib/hooks/useSubscriberChannels';
import { getJwt } from '@/components/lib/networkUtils';
import { AddToWorkflowDialog } from './add-workflow-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type ChannelType = 'all' | string;

interface WorkflowTab {
  workflowDefinitionId: string;
  name: string;
}

function GroupsPageContent() {
  const user = useUserStore((state) => state.user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workflowDefinitions, setWorkflowDefinitions] = useState<WorkflowTab[]>(
    []
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowDefinitionToDelete, setWorkflowDefinitionToDelete] =
    useState<WorkflowTab | null>(null);

  const [currentTab, setCurrentTab] = useState<ChannelType>('all');
  const [workflowDefinitionId, setWorkflowDefinitionId] = useState<string>('');

  // New state for workflow dialog
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [addToWorkflowDialogOpen, setAddToWorkflowDialogOpen] = useState(false);

  const currentView = searchParams.get('view') ?? 'list';
  const offset = parseInt(searchParams.get('offset') ?? '0');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  // 获取排序和过滤参数
  const sortColumn = searchParams.get('sortColumn') || undefined;
  const sortDirection = searchParams.get('sortDirection') as
    | 'asc'
    | 'desc'
    | undefined;

  // 收集过滤参数
  const filters: Record<string, string> = {};
  for (const [key, value] of Array.from(searchParams.entries())) {
    if (key.startsWith('filter_') && value) {
      const filterKey = key.replace('filter_', '');
      filters[filterKey] = value;
    }
  }

  const {
    data,
    loading: isLoading,
    mutate
  } = useSubscriberChannels({
    workflowDefinitionId: workflowDefinitionId || undefined,
    offset,
    pageSize,
    sortColumn,
    sortDirection,
    filters
  });

  const fetchWorkflowDefinitions = async () => {
    if (!user?.userId) return;
    try {
      const token = getJwt();
      const response = await fetch('/api/data-workflows', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      setWorkflowDefinitions(data.result || []);
    } catch (error) {
      console.error('Failed to fetch workflow definitions:', error);
    }
  };

  useEffect(() => {
    fetchWorkflowDefinitions();
  }, [user?.userId]);

  const handleDeleteWorkflow = async () => {
    if (!workflowDefinitionToDelete) return;

    try {
      const response = await fetch(
        `/api/data-workflows/${workflowDefinitionToDelete.workflowDefinitionId}`,
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

      // If currently on the deleted workflow tab, switch to 'all'
      if (currentTab === workflowDefinitionToDelete.workflowDefinitionId) {
        setCurrentTab('all');
        setWorkflowDefinitionId('');
      }

      await fetchWorkflowDefinitions();
      toast.success('Workflow deleted successfully');
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    } finally {
      setWorkflowDefinitionToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddToWorkflow = () => {
    if (selectedChannels.length === 0) {
      toast.error('Please select at least one channel');
      return;
    }
    setAddToWorkflowDialogOpen(true);
  };

  const handleWorkflowAdded = async () => {
    setSelectedChannels([]);
    await mutate();
  };

  return (
    <TabWrapper basePath="/subscriber/channels" defaultTab={currentTab}>
      <ViewStateHandler />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
          {/* <TabsList className="flex-shrink-0">
            <TabsTrigger
              value="all"
              onClick={() => {
                setCurrentTab('all');
                setWorkflowDefinitionId('');
              }}
            >
              All
            </TabsTrigger>
            {workflowDefinitions.map((workflowDefinition) => (
              <TabsTrigger
                key={workflowDefinition.workflowDefinitionId}
                value={workflowDefinition.workflowDefinitionId}
                onClick={() => {
                  setCurrentTab(workflowDefinition.workflowDefinitionId);
                  setWorkflowDefinitionId(
                    workflowDefinition.workflowDefinitionId
                  );
                }}
                className="group relative pr-6 flex items-center"
              >
                {workflowDefinition.name.charAt(0).toUpperCase() +
                  workflowDefinition.name.slice(1)}
                <div
                  role="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center hover:bg-gray-200 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWorkflowDefinitionToDelete(workflowDefinition);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              </TabsTrigger>
            ))}
          </TabsList> */}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {/* <GeneralSort /> */}
          {/* <AccountSelect /> */}
        </div>
      </div>

      <TabsContent value={currentTab} className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <RotateCw className="h-6 w-6 animate-spin" />
          </div>
        ) : currentView === 'list' ? (
          <GroupsTable
            chats={data?.chats || []}
            offset={offset}
            totalChats={data?.totalChats || 0}
            pageSize={pageSize}
            showCheckboxes={true}
            showDeleteAction={false}
            columns={GROUP_TAB_COLUMNS[currentTab] || GROUP_TAB_COLUMNS['all']}
            mutate={mutate}
            onChannelsSelected={setSelectedChannels}
            selectedChannels={selectedChannels}
            onAddToWorkflow={handleAddToWorkflow}
            currentTab={currentTab}
          />
        ) : (
          <GroupsGridView
            chats={data?.chats || []}
            offset={offset}
            totalChats={data?.totalChats || 0}
            pageSize={pageSize}
            showCheckboxes={false}
          />
        )}
      </TabsContent>

      {/* Add To Workflow Dialog */}
      <AddToWorkflowDialog
        open={addToWorkflowDialogOpen}
        onOpenChange={setAddToWorkflowDialogOpen}
        selectedChannels={selectedChannels}
        onComplete={handleWorkflowAdded}
      />

      {/* Delete Workflow Alert */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workflow "
              {workflowDefinitionToDelete?.name}" and remove all its
              associations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWorkflow}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabWrapper>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GroupsPageContent />
    </Suspense>
  );
}
