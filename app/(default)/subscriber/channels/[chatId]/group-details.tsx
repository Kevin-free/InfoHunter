'use client';

import { Badge } from '@/components/ui/badge';
import { GroupAvatar } from '@/components/ui/avatar';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useUserStore } from 'stores/userStore';
import ReactMarkdown from 'react-markdown';
import { Channel, WorkflowValue, Message } from '@/lib/types';
import { WorkflowValueHistory } from '../../workflows/[definitionId]/workflow-value-history';
import { PinnedMessagesCard } from './pinned-messages-card';
import { LatestMessagesCard } from './latest-messages-card';

interface GroupDetailsProps {
  chat: Channel;
  backLink: string;
  backLabel: string;
}

export function GroupDetails({ chat, backLink, backLabel }: GroupDetailsProps) {
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [publicWorkflows, setPublicWorkflows] = useState<any[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [pinnedMessageIds, setPinnedMessageIds] = useState<string[]>([]);
  const [latestMessages, setLatestMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [totalMessagesCount, setTotalMessagesCount] = useState<number>(0);

  // Fetch public workflows
  useEffect(() => {
    const fetchPublicWorkflows = async () => {
      try {
        setWorkflowsLoading(true);
        const response = await fetch(
          `/api/workflows/channel/${chat.channelId}/definitions?isPrivate=false`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch workflow definitions');
        }

        const data = await response.json();
        setPublicWorkflows(data.workflowDefinitions || []);
      } catch (error) {
        console.error('Error fetching workflow definitions:', error);
      } finally {
        setWorkflowsLoading(false);
      }
    };

    if (chat?.channelId) {
      fetchPublicWorkflows();
    }
  }, [chat?.channelId]);

  // Fetch messages data
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setMessagesLoading(true);
        // Fetch pinned messages
        const pinnedResponse = await fetch(
          `/api/messages/pinned/${chat.channelId}/`
        );

        if (pinnedResponse.ok) {
          const pinnedData = await pinnedResponse.json();
          setPinnedMessageIds(pinnedData.messageIds || []);
        }

        // Fetch latest messages
        const latestResponse = await fetch(
          `/api/messages/latest/${chat.channelId}/?limit=20`
        );

        if (latestResponse.ok) {
          const latestData = await latestResponse.json();
          setLatestMessages(latestData.messages || []);
        }

        // Fetch total message count
        const countResponse = await fetch(
          `/api/messages/count/${chat.channelId}/`
        );

        if (countResponse.ok) {
          const countData = await countResponse.json();
          setTotalMessagesCount(countData.count || 0);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setMessagesLoading(false);
      }
    };

    if (chat?.channelId) {
      fetchMessages();
    }
  }, [chat?.channelId]);

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Back Button */}
      <div>
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
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col gap-4">
            {/* 头部信息 */}
            <div className="flex items-center gap-3">
              <GroupAvatar
                photo={chat.metadata.photo || ''}
                name={chat.metadata.name || ''}
                size={48}
                is_r2_url={true}
              />
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {chat.metadata.name}
                </h2>
                <Badge
                  variant="outline"
                  className={`mt-1 ${chat.isPublic ? 'bg-[#E8FFF3] text-[#16B364] border-[#E8FFF3]' : 'bg-[#FFE8E8] text-[#F43F5E] border-[#FFE8E8]'} rounded-full px-2 py-0.5 text-xs font-medium w-fit`}
                >
                  {chat.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>

            {/* 信息网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Members</div>
                <div className="text-sm">{chat.metadata.participantsCount}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Created At</div>
                <div className="text-sm">{formatDateTime(chat.createdAt)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Last Synced</div>
                <div className="text-sm">
                  {formatDateTime(chat.lastSyncedAt)}
                </div>
              </div>
            </div>

            {/* 介绍信息 */}
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Introduce</div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm max-h-[200px] overflow-y-auto">
                    <ReactMarkdown>
                      {chat.metadata.about || 'No info'}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card: Pinned and latest messages of this channel */}
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Channel Messages ({totalMessagesCount})
            </h3>

            {messagesLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                Loading messages...
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {pinnedMessageIds.length > 0 && (
                  <PinnedMessagesCard messageIds={pinnedMessageIds} />
                )}

                {latestMessages.length > 0 && (
                  <LatestMessagesCard messages={latestMessages} />
                )}

                {!pinnedMessageIds.length && !latestMessages.length && (
                  <div className="w-full py-4 text-center text-muted-foreground">
                    No messages available for this channel
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card: Public Workflows */}
      <Card>
        <CardContent className="py-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Public Workflows ({publicWorkflows.length})
              </h3>
            </div>

            {workflowsLoading ? (
              <div className="py-4 text-center text-muted-foreground">
                Loading workflows...
              </div>
            ) : publicWorkflows.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {publicWorkflows.map((workflow) => (
                  <Card
                    key={workflow.workflow_definition_id}
                    className="hover:bg-accent/5 transition-colors cursor-pointer"
                  >
                    <Link
                      href={`/subscriber/workflows/${workflow.workflow_definition_id}`}
                      className="block p-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{workflow.name}</h4>
                          <Badge
                            variant={
                              workflow.status === 'active'
                                ? 'default'
                                : 'secondary'
                            }
                            className={
                              workflow.status === 'active'
                                ? 'bg-green-500 hover:bg-green-600'
                                : ''
                            }
                          >
                            {workflow.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {workflow.prompt}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>
                            Last updated: {formatDateTime(workflow.updated_at)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No public workflows found for this channel
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
