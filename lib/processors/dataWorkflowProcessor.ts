import {
  db,
  workflowDefinitions,
  workflowValues,
  messages,
  channelWorkflows,
  WorkflowDefinition,
  Message,
  Channel,
  channels,
  ChannelWorkflow
} from '@/lib/schema';
import { eq, and, sql, gt } from 'drizzle-orm';
import { AgentClient } from '../agents/agentClient';
import { desc } from 'drizzle-orm';
import { CreditService } from '../services/creditService';
import { qstashService } from '../services/qstash';
import { TempFileManager } from '../utils/tempFileManager';
import { v4 as uuidv4 } from 'uuid';

export class DataWorkflowProcessor {
  private agentClient: AgentClient;
  private isTestMode: boolean;
  private testLimit: number;
  private isManualRun: boolean;

  constructor(
    agentClient: AgentClient,
    options?: {
      isTestMode?: boolean;
      testLimit?: number;
      isManualRun?: boolean;
    }
  ) {
    this.agentClient = agentClient;
    this.isTestMode = options?.isTestMode ?? false;
    this.testLimit = options?.testLimit ?? 2;
    this.isManualRun = options?.isManualRun ?? false;
  }

  async processWorkflow(
    definitionId: string,
    options?: { isManualRun?: boolean }
  ) {
    try {
      const originalIsManualRun = this.isManualRun;
      if (options?.isManualRun) {
        this.isManualRun = true;
      }

      console.log(`---Processing single workflow ${definitionId}`);

      // get workflowDefinition from workflowDefinitions where workflowDefinitionId = definitionId
      const definition = await db
        .select()
        .from(workflowDefinitions)
        .where(eq(workflowDefinitions.workflowDefinitionId, definitionId))
        .then((rows) => rows[0]);

      if (!definition) {
        throw new Error(`Workflow definition ${definitionId} not found`);
      }

      // get from channelWorkflows where workflowDefinitionId = definitionId
      const theChannelWorkflows = await db
        .select()
        .from(channelWorkflows)
        .where(eq(channelWorkflows.workflowDefinitionId, definitionId));

      if (theChannelWorkflows.length === 0) {
        console.warn('no channel workflows found');
        return;
      }

      // check user credit < 0
      const userCredit = await CreditService.getUserCredit(definition.userId);
      if (userCredit < 0) {
        // update dataWorkflowDefinitions status to paused
        await db
          .update(workflowDefinitions)
          .set({ status: 'paused' })
          .where(eq(workflowDefinitions.workflowDefinitionId, definitionId));

        // pause qstash
        await qstashService.pauseWorkflowSchedule(definition.scheduleId);

        throw new Error('Insufficient credits');
      }

      await this.processDefinition(definition, theChannelWorkflows);

      this.isManualRun = originalIsManualRun;
    } catch (error) {
      console.error(`Error processing workflow ${definitionId}:`, error);
      // update workflow_values status to failed
      await db
        .update(workflowValues)
        .set({ status: 'failed' })
        .where(eq(workflowValues.workflowDefinitionId, definitionId));

      throw error;
    }
  }

  private async processDefinition(
    definition: WorkflowDefinition,
    channelWorkflows: ChannelWorkflow[]
  ) {
    const channelWorkflowsToProcess = this.isTestMode
      ? channelWorkflows.slice(0, this.testLimit)
      : channelWorkflows;

    // 创建聚合工作流值记录，并设置初始状态为处理中
    const workflowValueId = uuidv4();
    await db.insert(workflowValues).values({
      workflowValueId: workflowValueId,
      workflowDefinitionId: definition.workflowDefinitionId,
      channelId: '',
      status: 'processing',
      isAggregated: true
    });

    // 处理每个聊天并存储上下文到临时文件
    const tempFiles: string[] = [];
    for (const channelWorkflow of channelWorkflowsToProcess) {
      const tempFilePath = await this.processGroupData(
        definition,
        channelWorkflow
      );

      // Only add valid temp files (non-empty)
      if (tempFilePath) {
        tempFiles.push(tempFilePath);
      }
    }

    // Skip aggregation if no channels have messages
    if (tempFiles.length === 0) {
      console.log(
        `No channels with messages found for workflow ${definition.workflowDefinitionId}. Skipping aggregation.`
      );

      // Update the workflow value to completed with empty result
      await db
        .update(workflowValues)
        .set({
          value: 'No data available - all channels have no messages',
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(workflowValues.workflowValueId, workflowValueId));

      return;
    }

    try {
      // 使用临时文件处理聚合数据
      await this.processCollectionData(definition, tempFiles, workflowValueId);
    } finally {
      // 清理临时文件
      await TempFileManager.cleanupTempFiles(definition.workflowDefinitionId);
    }
  }

  /**
   * Get messages based on the workflow's message strategy
   */
  private async getMessagesByStrategy(
    channelId: string,
    definition: WorkflowDefinition
  ): Promise<Message[]> {
    const { messageStrategy } = definition;

    // Get pinned messages for the channel
    const pinnedMessages = await db
      .select()
      .from(messages)
      .where(
        and(eq(messages.channelId, channelId), eq(messages.isPinned, true))
      );

    // Apply different strategies for retrieving messages
    let latestMessages: Message[] = [];

    switch (messageStrategy) {
      case 'latest_n': {
        // Get message count from definition or use default (100)
        const messageCount = definition.messageCount || 100;

        // Get latest N messages
        latestMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.channelId, channelId))
          .orderBy(desc(messages.messageTimestamp))
          .limit(messageCount);
        break;
      }

      case 'past_time': {
        // Calculate timestamp based on time window
        const timeWindowValue = definition.timeWindowValue || 24;
        const timeWindowUnit = definition.timeWindowUnit || 'hours';

        // Convert to milliseconds
        let timeInMs: number;
        if (timeWindowUnit === 'days') {
          timeInMs = timeWindowValue * 24 * 60 * 60 * 1000;
        } else {
          timeInMs = timeWindowValue * 60 * 60 * 1000;
        }

        const timestamp = Date.now() - timeInMs;

        // Get messages after timestamp
        latestMessages = await db
          .select()
          .from(messages)
          .where(
            and(
              eq(messages.channelId, channelId),
              gt(messages.messageTimestamp, timestamp)
            )
          )
          .orderBy(desc(messages.messageTimestamp));
        break;
      }

      default:
        // Default to latest_n if strategy is not recognized
        const messageCount = definition.messageCount || 100;
        latestMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.channelId, channelId))
          .orderBy(desc(messages.messageTimestamp))
          .limit(messageCount);
        break;
    }

    return [...pinnedMessages, ...latestMessages];
  }

  /**
   * Modify the processGroupData method to use the new strategy
   */
  private async processGroupData(
    definition: WorkflowDefinition,
    channelWorkflow: ChannelWorkflow
  ): Promise<string> {
    try {
      // Get messages based on strategy
      const allMessages = await this.getMessagesByStrategy(
        channelWorkflow.channelId,
        definition
      );

      // Skip processing if the channel has no messages
      if (allMessages.length === 0) {
        console.log(
          `Skipping channel ${channelWorkflow.channelId} - no messages found`
        );
        return ''; // Return empty string to indicate this channel was skipped
      }

      // Separate pinned and regular messages
      const pinnedMessages = allMessages.filter((msg) => msg.isPinned);
      const latestMessages = allMessages.filter((msg) => !msg.isPinned);

      // Build context using the messages
      const context = await this.buildContext(
        channelWorkflow,
        pinnedMessages,
        latestMessages
      );

      // Save context to temp file
      const tempFilePath = await TempFileManager.writeTempFile(
        definition.workflowDefinitionId,
        channelWorkflow.channelId,
        context
      );

      const prompt = this.buildGroupPrompt(definition.prompt, context);

      const result = await this.agentClient.chatCompletion(
        definition.userId,
        [{ role: 'user', content: prompt }],
        definition.model,
        undefined,
        definition.workflowDefinitionId,
        'group'
      );

      await this.saveWorkflowValue(
        {
          value: result.content,
          confidence: result.confidence,
          reason: result.reason
        },
        definition.workflowDefinitionId,
        channelWorkflow.channelId,
        false
      );

      return tempFilePath;
    } catch (error) {
      // update workflow_values status to failed
      // await db
      //   .update(workflowValues)
      //   .set({ status: 'failed' })
      //   .where(
      //     and(
      //       eq(
      //         workflowValues.workflowDefinitionId,
      //         definition.workflowDefinitionId
      //       ),
      //       eq(workflowValues.channelId, channelWorkflow.channelId)
      //     )
      //   );

      throw error;
    }
  }

  private async buildContext(
    channelWorkflow: ChannelWorkflow,
    pinnedMessages: Message[],
    latestMessages: Message[]
  ): Promise<{ channel: Channel; messages: Message[] }> {
    const maxContextLength = 24000;
    let currentLength = 0;

    // get channel from channels where channelId = channelWorkflow.channelId
    const channel = await db
      .select()
      .from(channels)
      .where(eq(channels.channelId, channelWorkflow.channelId))
      .then((rows) => rows[0]);

    if (!channel) {
      throw new Error(`Channel ${channelWorkflow.channelId} not found`);
    }

    // Create a copy of metadata without the photo field
    // Because the photo field is a base64 image, it will cause the context to be too long
    const metadataWithoutPhoto = channel.metadata
      ? { ...channel.metadata }
      : {};
    if (metadataWithoutPhoto && typeof metadataWithoutPhoto === 'object') {
      delete (metadataWithoutPhoto as any).photo;
    }

    // Replace the original metadata with the filtered version
    const channelWithoutPhoto = {
      ...channel,
      metadata: metadataWithoutPhoto
    };

    const metadataStr = JSON.stringify(channelWithoutPhoto.metadata);
    currentLength += metadataStr.length;

    const messages: Message[] = [...pinnedMessages];

    for (const msg of latestMessages) {
      const msgLength = (msg.messageText || '').length + 50;
      if (currentLength + msgLength > maxContextLength) break;

      if (!messages.find((m) => m.messageId === msg.messageId)) {
        messages.push(msg);
        currentLength += msgLength;
      }
    }

    return {
      channel: channelWithoutPhoto,
      messages: messages.sort(
        (a, b) =>
          new Date(a.messageTimestamp).getTime() -
          new Date(b.messageTimestamp).getTime()
      )
    };
  }

  private buildGroupPrompt(
    basePrompt: string,
    context: { channel: Channel; messages: Message[] }
  ): string {
    const { channel, messages } = context;

    return `${basePrompt}

Chat Information:
Metadata: ${JSON.stringify(channel?.metadata)}

Pinned and Latest Messages:
${messages
  .map(
    (m) =>
      `[${new Date(m.messageTimestamp).toISOString()}] ${
        m.senderId
      }: ${m.messageText}`
  )
  .join('\n')}`;
  }

  private async processCollectionData(
    definition: WorkflowDefinition,
    tempFiles: string[],
    workflowValueId: string
  ): Promise<void> {
    try {
      // 读取所有临时文件的上下文
      const contexts = await Promise.all(
        tempFiles.map(async (filePath) =>
          TempFileManager.readTempFile(filePath)
        )
      );

      // 使用所有上下文构建集合级提示
      const prompt = this.buildCollectionPromptWithContext(
        definition.prompt,
        contexts
      );

      const result = await this.agentClient.chatCompletion(
        definition.userId,
        [{ role: 'user', content: prompt }],
        definition.model,
        undefined,
        definition.workflowDefinitionId,
        'collection'
      );

      // 使用预先创建的 workflowValueId 更新工作流值记录
      await db
        .update(workflowValues)
        .set({
          value: result.content,
          confidence: result.confidence.toString(),
          reason: result.reason,
          status: 'completed',
          updatedAt: new Date()
        })
        .where(eq(workflowValues.workflowValueId, workflowValueId));

      // 同时保存到工作流值表中作为新版本
      // await this.saveWorkflowValue(
      //   {
      //     value: result.content,
      //     confidence: result.confidence,
      //     reason: result.reason
      //   },
      //   definition.workflowDefinitionId,
      //   '',
      //   true
      // );
    } catch (error) {
      // 处理失败时更新状态
      await db
        .update(workflowValues)
        .set({
          status: 'failed',
          reason: error instanceof Error ? error.message : String(error),
          updatedAt: new Date()
        })
        .where(eq(workflowValues.workflowValueId, workflowValueId));

      throw error;
    }
  }

  private buildCollectionPromptWithContext(
    basePrompt: string,
    contexts: Array<{ channel: Channel; messages: Message[] }>
  ): string {
    const contextSummaries = contexts.map((context) => {
      const { channel, messages } = context;
      const metadata = channel.metadata as {
        name?: string;
        about?: string;
        username?: string;
        participantsCount?: number;
        type?: string;
      };

      return `Group: ${metadata?.name || 'Unknown'}
Type: ${metadata?.type || 'Unknown'}
Username: ${metadata?.username ? '@' + metadata.username : 'Private Group'}
Participants: ${metadata?.participantsCount || 'Unknown'} members
Description: ${metadata?.about || 'No description'}

Recent Messages: ${messages.length} messages
${messages
  .map(
    (m) =>
      `[${new Date(m.messageTimestamp).toISOString()}] ${
        m.senderId
      }: ${m.messageText}`
  )
  .join('\n')}
-------------------`;
    });

    return `${basePrompt}

Analysis Context:
${contextSummaries.join('\n\n')}`;
  }

  private async saveWorkflowValue(
    data: {
      value: string;
      confidence: number;
      reason: string;
    },
    workflowDefinitionId: string,
    channelId: string,
    isAggregated: boolean
  ) {
    const latestVersion = await db
      .select({ version: sql<number>`MAX(version)` })
      .from(workflowValues)
      .where(
        and(
          eq(workflowValues.workflowDefinitionId, workflowDefinitionId),
          eq(workflowValues.channelId, channelId)
        )
      )
      .then((rows) => (rows[0]?.version || 0) + 1);

    await db.insert(workflowValues).values({
      workflowValueId: uuidv4(),
      workflowDefinitionId,
      channelId,
      value: data.value,
      confidence: data.confidence.toString(),
      reason: data.reason,
      version: latestVersion,
      status: 'completed',
      isAggregated
    });
  }
}
