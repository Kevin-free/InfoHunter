import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  RotateCw,
  Pause,
  Play,
  MoreHorizontal,
  Edit,
  Trash
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { WorkflowDefinition } from '@/lib/schema';
import { WorkflowDialog } from './workflow-dialog';

interface DataWorkflowsTableProps {
  workflows: WorkflowDefinition[];
  offset: number;
  totalWorkflows: number;
  pageSize: number;
  basePath: string;
  collectionId: number;
  onWorkflowClick: (id: string) => void;
  onManualRun: (id: string) => Promise<void>;
  onStatusChange: (id: string, status: 'active' | 'paused') => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DataWorkflowsTable({
  workflows,
  offset,
  totalWorkflows,
  pageSize = 20,
  basePath = '/subscriber/workflows',
  onWorkflowClick,
  onManualRun,
  onStatusChange,
  onDelete
}: DataWorkflowsTableProps) {
  const [runningWorkflows, setRunningWorkflows] = useState<string[]>([]);
  const [editingWorkflow, setEditingWorkflow] =
    useState<WorkflowDefinition | null>(null);
  const router = useRouter();
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const handleManualRun = async (id: string) => {
    try {
      setRunningWorkflows((prev) => [...prev, id]);
      await onManualRun(id);
    } finally {
      setRunningWorkflows((prev) => prev.filter((wId) => wId !== id));
    }
  };

  const handleStatusChange = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await onStatusChange(id, newStatus);
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

  const handleDeleteClick = async () => {
    if (deleteWorkflowId) {
      await onDelete(deleteWorkflowId);
      setDeleteWorkflowId(null);
    }
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('offset', newOffset.toString());
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <>
      <Card className="border border-gray-200/50 rounded-xl bg-muted/60">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Refresh Interval</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Next Run</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow
                  key={workflow.workflowDefinitionId}
                  className="cursor-pointer"
                  onClick={() => onWorkflowClick(workflow.workflowDefinitionId)}
                >
                  <TableCell>{workflow.name}</TableCell>
                  <TableCell>{workflow.model}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`mt-1 ${!workflow.isPrivate ? 'bg-[#E8FFF3] text-[#16B364] border-[#E8FFF3]' : 'bg-[#FFE8E8] text-[#F43F5E] border-[#FFE8E8]'} rounded-full px-2 py-0.5 text-xs font-medium w-fit`}
                    >
                      {workflow.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                  </TableCell>
                  <TableCell>{workflow.refreshIntervalHours} hours</TableCell>
                  <TableCell>{formatDateTime(workflow.updatedAt)}</TableCell>
                  <TableCell>
                    {formatDateTime(getNextRunTime(workflow))}
                  </TableCell>
                  <TableCell>
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(
                            workflow.workflowDefinitionId,
                            workflow.status
                          )
                        }
                        disabled={runningWorkflows.includes(
                          workflow.workflowDefinitionId
                        )}
                      >
                        {workflow.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              handleManualRun(workflow.workflowDefinitionId)
                            }
                            disabled={runningWorkflows.includes(
                              workflow.workflowDefinitionId
                            )}
                          >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Run it manually
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setEditingWorkflow(workflow)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive hover:!bg-destructive hover:!text-destructive-foreground"
                            onClick={() =>
                              setDeleteWorkflowId(workflow.workflowDefinitionId)
                            }
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + pageSize, totalWorkflows)}{' '}
            of {totalWorkflows} workflows
          </div>
          <Pagination
            currentPage={Math.floor(offset / pageSize) + 1}
            totalPages={Math.ceil(totalWorkflows / pageSize)}
            pageSize={pageSize}
            onPageChange={(page) => {
              const newOffset = (page - 1) * pageSize;
              handlePageChange(newOffset);
            }}
            onPageSizeChange={(newPageSize) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('pageSize', newPageSize.toString());
              params.set('offset', '0');
              router.push(`${basePath}?${params.toString()}`);
            }}
          />
        </CardFooter>
      </Card>

      {editingWorkflow && (
        <WorkflowDialog
          mode="edit"
          workflow={editingWorkflow}
          open={!!editingWorkflow}
          onOpenChange={(open) => !open && setEditingWorkflow(null)}
          onWorkflowChange={() => window.location.reload()}
        />
      )}

      <Dialog
        open={deleteWorkflowId !== null}
        onOpenChange={(open) => !open && setDeleteWorkflowId(null)}
      >
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
            <Button variant="outline" onClick={() => setDeleteWorkflowId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClick}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
