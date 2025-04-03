export interface Entity {
  name?: string;
  type?: string;
  chain?: string;
  address?: string;
  twitter?: string;
  website?: string;
}

export interface ChatMessage {
  messageId: string;
  chatId: string;
  messageText: string;
  senderId?: string;
  replyTo?: string;
  topicId?: string;
  messageTimestamp: number;
  isPinned?: boolean;
}

export interface QualityReport {
  score: number;
  reason: string;
  processed_at: number;
}

export type ChatMetadata = {
  id: number;
  chatId: string;
  name: string;
  about: string;
  aiAbout: string;
  username: string;
  participantsCount: number;
  pinnedMessages: string[];
  initialMessages: string[];
  category: string;
  entity: Entity | null;
  qualityReports: QualityReport[];
  qualityScore: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  photo: string;
  accountTgIds: string[];
};

export type GroupTableColumn =
  | 'Name'
  | 'Intro'
  | 'Members'
  | 'Messages'
  | 'Account'
  | 'Publisher'
  | 'Pricing'
  | 'Created At'
  | 'Is Channel'
  | 'Last Synced'
  | 'Last Message';

export const GROUP_TAB_COLUMNS: Record<string, GroupTableColumn[]> = {
  // for publisher/channels
  private: [
    'Name',
    'Intro',
    'Members',
    'Messages',
    'Account',
    'Last Synced',
    'Last Message'
  ],
  public: [
    'Name',
    'Intro',
    'Members',
    'Messages',
    'Account',
    'Pricing',
    'Last Synced',
    'Last Message'
  ],
  // for publisher/groups
  published: [
    'Name',
    'Intro',
    'Members',
    'Account',
    'Is Channel',
    'Last Synced'
  ],
  unpublished: [
    'Name',
    'Intro',
    'Members',
    'Account',
    'Is Channel',
    'Last Synced'
  ],
  // for subscriber/channels
  all: [
    'Name',
    'Intro',
    'Members',
    'Messages',
    'Publisher',
    'Pricing',
    'Last Synced',
    'Last Message'
  ]
};

export enum AccountStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  SUSPENDED = 'suspended'
}

export type AccountTableColumn =
  | 'username'
  | 'tgId'
  | 'phone'
  | 'status'
  | 'fullname'
  | 'status'
  | 'lastActiveAt'
  | 'createdAt'
  | 'actions';

export const ACCOUNT_TAB_COLUMNS: Record<string, AccountTableColumn[]> = {
  active: [
    'username',
    'tgId',
    'phone',
    'fullname',
    'status',
    'lastActiveAt',
    'actions'
  ],
  banned: ['username', 'tgId', 'phone', 'status', 'lastActiveAt', 'actions'],
  suspended: ['username', 'tgId', 'status', 'lastActiveAt', 'actions']
};

export interface Message {
  id: number;
  messageText: string;
  messageTimestamp: number;
  buttons: any[];
  reactions: any[];
}

export type MetricTableColumn =
  | 'Name'
  | 'Description'
  | 'Prompt'
  | 'Model'
  | 'Refresh Interval'
  | 'Is Preset'
  | 'Created At'
  | 'Updated At';

export const METRIC_TAB_COLUMNS: Record<string, MetricTableColumn[]> = {
  enabled: [
    'Name',
    'Description',
    'Prompt',
    'Refresh Interval',
    'Is Preset',
    'Created At'
  ],
  disabled: [
    'Name',
    'Description',
    'Prompt',
    'Refresh Interval',
    'Is Preset',
    'Created At'
  ]
};

export enum ChatType {
  CHANNEL = 'channel',
  GIGA_GROUP = 'giga_group',
  MEGA_GROUP = 'mega_group',
  GROUP = 'group'
}

export enum ChatStatus {
  EVALUATING = 'evaluating',
  ACTIVE = 'active',
  LOW_QUALITY = 'low_quality',
  BLOCKED = 'blocked'
}

export enum AccountChatStatus {
  WATCHING = 'watching',
  QUIT = 'quit'
}

export interface DataWorkflowDefinition {
  id: number;
  userId: string;
  collectionId: number;
  name: string;
  prompt: string;
  model: string;
  refreshIntervalHours: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataWorkflowValue {
  id: number;
  chatId: string;
  collectionId: number;
  value: string;
  confidence: number;
  reason: string;
  updatedAt: Date;
  version: number;
  status: string;
}

export interface DataWorkflowValueWithChat extends DataWorkflowValue {
  chatName: string | null;
  chatPhoto: string | null;
  chatUsername: string | null;
  participantsCount: number | null;
}

export interface ValueDetailDialogProps {
  value: DataWorkflowValue | DataWorkflowValueWithChat | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGroupValue?: boolean;
}

export interface WorkflowValueHistoryProps {
  values: (DataWorkflowValue | DataWorkflowValueWithChat)[][];
  isGroupValues?: boolean;
  dataWorkflowDefinitionName?: string;
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export enum DataSourceType {
  TG_GROUP = 'tg_group',
  X_ACCOUNT = 'x_account'
}

export enum DataSourceStatus {
  WATCHING = 'watching',
  QUIT = 'quit'
}

export interface Channel {
  id: number;
  channelId: string;
  userId: string;
  dataType: string;
  dataId: string;
  metadata: Record<string, any>;
  isPublic: boolean;
  isFree: boolean;
  subscriptionFee: string;
  lastSyncedAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: number;
}

export interface ChannelsResponse {
  data: Channel[];
  totalCount?: number;
  error?: string;
}

export interface WorkflowValue {
  id: number;
  workflow_value_id: string;
  workflow_definition_id: string;
  channel_id: string;
  value: string;
  confidence: number;
  reason: string;
  version: number;
  status: string;
  is_aggregated: boolean;
  created_at: string;
  updated_at: string;
  workflow_name?: string;
}

export enum WorkflowScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused'
}
