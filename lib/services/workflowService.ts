import { db } from '@/lib/schema';
import { workflowDefinitions, channelWorkflows, channels } from '@/lib/schema';
import { eq, and, sum } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

export class WorkflowService {
  /**
   * 通过工作流定义ID获取关联渠道的订阅费用总和
   * @param workflowDefinitionId 工作流定义ID
   * @returns 订阅费用总和（Decimal实例）
   */
  static async getWorkflowSubscriptionFee(
    workflowDefinitionId: string
  ): Promise<Decimal> {
    try {
      // 通过工作流ID查找所有关联的渠道，并计算订阅费用总和
      const result = await db
        .select({
          totalFee: sum(channels.subscriptionFee)
        })
        .from(channelWorkflows)
        .innerJoin(channels, eq(channelWorkflows.channelId, channels.channelId))
        .where(
          and(
            eq(channelWorkflows.workflowDefinitionId, workflowDefinitionId),
            eq(channels.isFree, false)
          )
        );

      // 如果结果为空或者总和为null，返回0
      const totalFee = result[0]?.totalFee || 0;
      // 直接返回Decimal实例
      return new Decimal(
        typeof totalFee === 'number' ? totalFee : totalFee.toString()
      );
    } catch (error) {
      console.error('Error getting workflow subscription fee:', error);
      return new Decimal(0);
    }
  }

  /**
   * 获取工作流定义的基本信息
   * @param workflowDefinitionId 工作流定义ID
   * @returns 工作流定义信息
   */
  static async getWorkflowDefinition(workflowDefinitionId: string) {
    try {
      const definition = await db
        .select()
        .from(workflowDefinitions)
        .where(
          eq(workflowDefinitions.workflowDefinitionId, workflowDefinitionId)
        )
        .then((results) => results[0]);

      return definition;
    } catch (error) {
      console.error('Error getting workflow definition:', error);
      return null;
    }
  }

  /**
   * 获取工作流关联的所有渠道
   * @param workflowDefinitionId 工作流定义ID
   * @returns 关联的渠道列表
   */
  static async getWorkflowChannels(workflowDefinitionId: string) {
    try {
      const channelList = await db
        .select({
          channelId: channels.channelId,
          userId: channels.userId,
          dataType: channels.dataType,
          dataId: channels.dataId,
          isPublic: channels.isPublic,
          isFree: channels.isFree,
          subscriptionFee: channels.subscriptionFee,
          metadata: channels.metadata
        })
        .from(channelWorkflows)
        .innerJoin(channels, eq(channelWorkflows.channelId, channels.channelId))
        .where(eq(channelWorkflows.workflowDefinitionId, workflowDefinitionId));

      return channelList;
    } catch (error) {
      console.error('Error getting workflow channels:', error);
      return [];
    }
  }

  /**
   * 获取工作流关联的渠道及其订阅费用信息
   * @param workflowDefinitionId 工作流定义ID
   * @returns 渠道及其所有者和订阅费用的列表
   */
  static async getWorkflowChannelsWithFees(
    workflowDefinitionId: string
  ): Promise<{ channelId: string; userId: string; subscriptionFee: string }[]> {
    try {
      const result = await db
        .select({
          channelId: channels.channelId,
          userId: channels.userId,
          subscriptionFee: channels.subscriptionFee
        })
        .from(channelWorkflows)
        .innerJoin(channels, eq(channelWorkflows.channelId, channels.channelId))
        .where(
          and(
            eq(channelWorkflows.workflowDefinitionId, workflowDefinitionId),
            eq(channels.isFree, false)
          )
        );
      return result;
    } catch (error) {
      console.error('Error getting workflow channels with fees:', error);
      return [];
    }
  }
}
