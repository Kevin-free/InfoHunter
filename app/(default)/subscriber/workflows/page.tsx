'use client';

import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabWrapper } from '@/components/shared/tab-wrapper';
import { DataWorkflowsTable } from './workflows-table';
import { useUserStore } from 'stores/userStore';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getJwt } from '@/components/lib/networkUtils';
import { X } from 'lucide-react';
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
import { toast } from 'react-hot-toast';
import { WorkflowDefinition } from '@/lib/schema';
import { WorkflowDialog } from './workflow-dialog';

interface CollectionTab {
  id: number;
  name: string;
}

function WorkflowsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [collections, setCollections] = useState<CollectionTab[]>([]);
  const [workflowDefinitions, setWorkflowDefinitions] = useState<
    WorkflowDefinition[]
  >([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<CollectionTab | null>(null);

  const [currentTab, setCurrentTab] = useState<string>('all');
  const [collectionId, setCollectionId] = useState<number>(0);

  const offset = parseInt(searchParams.get('offset') ?? '0');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const fetchDataWorkflowDefinitions = async () => {
    if (!user?.userId) return;
    try {
      const response = await fetch(`/api/data-workflows`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getJwt()}`
        }
      });
      const data = await response.json();
      setWorkflowDefinitions(data.result || []);
    } catch (error) {
      console.error('Failed to fetch data workflow definitions:', error);
    }
  };

  useEffect(() => {
    fetchDataWorkflowDefinitions();
  }, [user?.userId]);

  const handleDeleteCollection = async (collection: CollectionTab) => {
    try {
      const token = getJwt();
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete collection');

      // 如果当前在被删除的collection tab，切换到 'all' tab
      if (currentTab === collection.id.toString()) {
        setCurrentTab('all');
        // 更新 URL 参数以触发路由变化
        const params = new URLSearchParams(searchParams.toString());
        params.delete('tab'); // 删除 tab 参数，默认回到 'all'
        router.push(`/subscriber/groups?${params.toString()}`);
      }
    } catch (error) {
      console.error('Failed to delete collection:', error);
    }
  };

  const handleManualRun = async (definitionId: string) => {
    try {
      const response = await fetch(
        `/api/data-workflows/${definitionId}/process`,
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

      await fetchDataWorkflowDefinitions();
      toast.success('Workflow started successfully');
    } catch (error) {
      console.error('Failed to run workflow:', error);
      toast.error('Failed to run workflow');
    }
  };

  const handleStatusChange = async (
    id: string,
    status: 'active' | 'paused'
  ) => {
    try {
      const response = await fetch(`/api/data-workflows/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed to update workflow status');
      }

      // Refresh the workflows list
      await fetchDataWorkflowDefinitions();
    } catch (error) {
      console.error('Error updating workflow status:', error);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/data-workflows/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${getJwt()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete workflow');
      }

      // Refresh the workflows list
      await fetchDataWorkflowDefinitions();
      toast.success('Workflow deleted successfully');
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    }
  };

  return (
    <TabWrapper basePath="/subscriber/workflows" defaultTab={currentTab}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 sm:pb-0">
          {/* <TabsList className="flex-shrink-0">
            <TabsTrigger
              value="all"
              onClick={() => {
                setCurrentTab('all');
                setCollectionId(0);
                fetchDataWorkflowDefinitions(0);
              }}
            >
              All
            </TabsTrigger>
            {collections.map((collection) => (
              <TabsTrigger
                key={collection.id}
                value={collection.id.toString()}
                onClick={() => {
                  setCurrentTab(collection.id.toString());
                  setCollectionId(collection.id);
                  fetchDataWorkflowDefinitions(collection.id);
                }}
                className="group relative pr-6 flex items-center"
              >
                {collection.name.charAt(0).toUpperCase() +
                  collection.name.slice(1)}
                <div
                  role="button"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center hover:bg-gray-200 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollectionToDelete(collection);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              </TabsTrigger>
            ))}
          </TabsList> */}

          {user?.userId && (
            <WorkflowDialog
              mode="add"
              onWorkflowChange={() => {
                fetchDataWorkflowDefinitions();
              }}
            />
          )}
        </div>
      </div>

      <TabsContent value={currentTab} className="mt-4">
        <DataWorkflowsTable
          workflows={workflowDefinitions}
          collectionId={collectionId}
          offset={offset}
          totalWorkflows={workflowDefinitions.length}
          pageSize={pageSize}
          basePath="/subscriber/workflows"
          onWorkflowClick={(id) => router.push(`/subscriber/workflows/${id}`)}
          onManualRun={handleManualRun}
          onStatusChange={handleStatusChange}
          onDelete={handleDeleteWorkflow}
        />
      </TabsContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the collection "
              {collectionToDelete?.name}" and remove all associated groups and
              metrics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (collectionToDelete) {
                  handleDeleteCollection(collectionToDelete);
                }
                setDeleteDialogOpen(false);
                setCollectionToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TabWrapper>
  );
}

export default function WorkflowsPage() {
  return <WorkflowsPageContent />;
}
