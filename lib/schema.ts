import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
export const db = drizzle(client);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().unique(),
  photoUrl: varchar('photo_url', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  username: varchar('username', { length: 255 }).unique(),
  displayName: varchar('display_name', { length: 255 }),
  isAdmin: boolean('is_admin').default(false),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const channels = pgTable('channels', {
  id: serial('id').primaryKey(),
  channelId: varchar('channel_id', { length: 255 }).notNull().unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  dataType: varchar('data_type', { length: 255 }).notNull(),
  dataId: varchar('data_id', { length: 255 }).notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  isPublic: boolean('is_public').notNull().default(false),
  isFree: boolean('is_free').notNull().default(false),
  subscriptionFee: decimal('subscription_fee', { precision: 20, scale: 8 })
    .notNull()
    .default('0'),
  lastSyncedAt: timestamp('last_synced_at', {
    withTimezone: true
  }).defaultNow(),
  status: varchar('status', { length: 255 }).default('watching'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  messageId: varchar('message_id', { length: 255 }).notNull().unique(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  chatId: varchar('chat_id', { length: 255 }).notNull(),
  replyTo: varchar('reply_to', { length: 255 }),
  topicId: varchar('topic_id', { length: 255 }),
  messageText: text('message_text').notNull(),
  buttons: jsonb('buttons').default([]),
  senderId: varchar('sender_id', { length: 255 }),
  sender: jsonb('sender').default({}),
  reactions: jsonb('reactions').default([]),
  messageTimestamp: integer('message_timestamp').notNull(),
  isPinned: boolean('is_pinned').default(false),
  createdAt: integer('created_at')
    .notNull()
    .default(sql`EXTRACT(EPOCH FROM NOW())::BIGINT`)
});

export const workflowDefinitions = pgTable('workflow_definitions', {
  id: serial('id').primaryKey(),
  workflowDefinitionId: varchar('workflow_definition_id', { length: 255 })
    .notNull()
    .unique(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  prompt: text('prompt').notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  refreshIntervalHours: integer('refresh_interval_hours').notNull().default(0),
  scheduleId: varchar('schedule_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 255 }).notNull().default('paused'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  messageStrategy: varchar('message_strategy', { length: 255 })
    .notNull()
    .default('latest_n'),
  messageCount: integer('message_count').notNull().default(100),
  timeWindowValue: integer('time_window_value').default(24),
  timeWindowUnit: varchar('time_window_unit', { length: 20 }).default('hours'),
  isPrivate: boolean('is_private').notNull().default(false)
});

export const workflowValues = pgTable('workflow_values', {
  id: serial('id').primaryKey(),
  workflowValueId: varchar('workflow_value_id', {
    length: 255
  }).notNull(),
  workflowDefinitionId: varchar('workflow_definition_id', {
    length: 255
  }).notNull(),
  channelId: varchar('channel_id', { length: 255 }).notNull(),
  value: text('value'),
  confidence: decimal('confidence', { precision: 4, scale: 2 }),
  reason: text('reason'),
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 255 }).notNull().default('pending'),
  isAggregated: boolean('is_aggregated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const channelWorkflows = pgTable(
  'channel_workflows',
  {
    id: serial('id').primaryKey(),
    channelId: varchar('channel_id', { length: 255 }).notNull(),
    workflowDefinitionId: varchar('workflow_definition_id', {
      length: 255
    }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
  },
  (table) => {
    return {
      channelWorkflowUnique: uniqueIndex('channel_workflow_unique_idx').on(
        table.channelId,
        table.workflowDefinitionId
      )
    };
  }
);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  chainId: integer('chain_id').notNull(),
  originalAmount: decimal('original_amount', {
    precision: 20,
    scale: 8
  }).notNull(),
  tokenDecimals: integer('token_decimals').notNull(),
  tokenAddress: varchar('token_address', { length: 255 }).notNull(),
  originalAmountOnChain: varchar('original_amount_on_chain', {
    length: 255
  }).notNull(),
  transferAmountOnChain: varchar('transfer_amount_on_chain', {
    length: 255
  }).notNull(),
  transferAddress: varchar('transfer_address', { length: 255 }).notNull(),
  transferHash: text('transfer_hash'),
  applicationId: varchar('application_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  createTimestamp: integer('create_timestamp').notNull(),
  finishTimestamp: integer('finish_timestamp'),
  externalOrderId: varchar('external_order_id', { length: 255 }).notNull(),
  credits: decimal('credits', { precision: 20, scale: 8 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const userCredits = pgTable('user_credits', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  credits: decimal('credits', { precision: 20, scale: 8 })
    .notNull()
    .default('0'),
  workflows: integer('workflows').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

export const creditConsumptionLogs = pgTable('credit_consumption_logs', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  workflowDefinitionId: varchar('workflow_definition_id', {
    length: 255
  }).notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  creditsConsumed: decimal('credits_consumed', {
    precision: 20,
    scale: 8
  }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
});

export const apikeys = pgTable('apikeys', {
  id: serial('id').primaryKey(),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 100 }),
  userId: varchar('user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  status: varchar('status', { length: 50 }).default('active')
});

export type User = typeof users.$inferSelect;
export type Channel = typeof channels.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type WorkflowDefinition = typeof workflowDefinitions.$inferSelect;
export type WorkflowValue = typeof workflowValues.$inferSelect;
export type ChannelWorkflow = typeof channelWorkflows.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type UserCredit = typeof userCredits.$inferSelect;
export type CreditConsumptionLog = typeof creditConsumptionLogs.$inferSelect;
export type ApiKey = typeof apikeys.$inferSelect;
