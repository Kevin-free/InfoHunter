import { db } from '@/lib/schema';
import {
  userCredits,
  creditConsumptionLogs,
  workflowDefinitions
} from '@/lib/schema';
import { eq, sql, count } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

export class CreditService {
  static async getUserCredit(userId: string): Promise<number> {
    const userCredit = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    return Number(userCredit[0].credits);
  }

  static async deductCredits(
    userId: string,
    credits: string,
    model: string,
    workflowDefinitionId?: string
  ): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Deduct credits
      await tx
        .update(userCredits)
        .set({
          credits: sql`${userCredits.credits} - ${credits}`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userId, userId));

      // Log consumption
      await tx.insert(creditConsumptionLogs).values({
        userId,
        workflowDefinitionId: workflowDefinitionId || '',
        model,
        creditsConsumed: credits,
        createdAt: new Date()
      });

      return true;
    });
  }

  static async addCredits(userId: string, credits: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      await tx
        .update(userCredits)
        .set({
          credits: sql`${userCredits.credits} + ${credits}`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userId, userId));

      return true;
    });
  }

  static async getUserWorkflows(userId: string): Promise<number> {
    const userWorkflow = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    return Number(userWorkflow[0].workflows);
  }

  static async getWorkflowsCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(workflowDefinitions)
      .where(eq(workflowDefinitions.userId, userId));

    return result[0].count;
  }

  static async addWorkflows(
    userId: string,
    workflows: number
  ): Promise<boolean> {
    return await db.transaction(async (tx) => {
      await tx
        .update(userCredits)
        .set({
          workflows: sql`${userCredits.workflows} + ${workflows}`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userId, userId));

      return true;
    });
  }

  static async purchaseWorkflowPackage(
    userId: string,
    creditCost: number,
    workflowsToAdd: number
  ): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Deduct credits
      await tx
        .update(userCredits)
        .set({
          credits: sql`${userCredits.credits} - ${creditCost}`,
          workflows: sql`${userCredits.workflows} + ${workflowsToAdd}`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userId, userId));

      // Log consumption
      await tx.insert(creditConsumptionLogs).values({
        userId,
        workflowDefinitionId: 'purchase_workflows',
        model: 'workflow_package',
        creditsConsumed: creditCost.toString(),
        createdAt: new Date()
      });

      return true;
    });
  }

  static async hasEnoughWorkflowSlots(userId: string): Promise<boolean> {
    const [userWorkflow, workflowCount] = await Promise.all([
      this.getUserWorkflows(userId),
      this.getWorkflowsCount(userId)
    ]);

    return workflowCount < userWorkflow;
  }

  /**
   * 在扣除用户积分的同时向发布者增加订阅费用积分
   * @param subscriberId 订阅用户ID
   * @param totalCredits 总扣除积分
   * @param aiCredits AI用量积分
   * @param model 使用的模型
   * @param workflowDefinitionId 工作流定义ID
   * @param publisherFees 发布者及其应得订阅费用的列表
   * @returns 操作是否成功
   */
  static async processWorkflowCredits(
    subscriberId: string,
    totalCredits: string,
    aiCredits: Decimal,
    model: string,
    workflowDefinitionId: string,
    publisherFees: { userId: string; subscriptionFee: string }[]
  ): Promise<boolean> {
    console.log(
      `Starting credit transaction - Subscriber: ${subscriberId}, Total: ${totalCredits}, Workflow: ${workflowDefinitionId}`
    );
    console.log(`Publisher fees distribution:`, JSON.stringify(publisherFees));

    // 从环境变量读取分佣比例，默认为80%
    const publisherCommissionRate = Number(
      process.env.PUBLISHER_COMMISSION_RATE || 0.8
    );
    console.log(
      `Using publisher commission rate: ${publisherCommissionRate * 100}%`
    );

    return await db.transaction(async (tx) => {
      // 1. Deduct total credits from subscriber
      await tx
        .update(userCredits)
        .set({
          credits: sql`${userCredits.credits} - ${totalCredits}`,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userId, subscriberId));

      console.log(
        `Deducted ${totalCredits} credits from subscriber ${subscriberId}`
      );

      // 2. Log the consumption for the subscriber
      await tx.insert(creditConsumptionLogs).values({
        userId: subscriberId,
        workflowDefinitionId: workflowDefinitionId,
        model,
        creditsConsumed: totalCredits,
        createdAt: new Date()
      });

      // 3. Add subscription fees to publishers
      for (const { userId, subscriptionFee } of publisherFees) {
        if (
          userId &&
          subscriptionFee &&
          new Decimal(subscriptionFee).greaterThan(0)
        ) {
          // 计算发布者应得的佣金（订阅费用 × 分佣比例）
          const publisherCommission = new Decimal(subscriptionFee)
            .mul(publisherCommissionRate)
            .toFixed(8); // 保持精度为8位小数

          // 即使是自己订阅自己的频道，也添加佣金
          // 移除不再需要的自订阅跳过逻辑

          // Add credits to publisher
          await tx
            .update(userCredits)
            .set({
              credits: sql`${userCredits.credits} + ${publisherCommission}`,
              updatedAt: new Date()
            })
            .where(eq(userCredits.userId, userId));

          const isSelfSubscription = userId === subscriberId;
          console.log(
            `Added ${publisherCommission} credits to publisher ${userId}` +
              (isSelfSubscription ? ' (self-subscription)' : '')
          );

          // Log the credits added to publisher as a negative consumption (income)
          await tx.insert(creditConsumptionLogs).values({
            userId,
            workflowDefinitionId: workflowDefinitionId,
            model: 'subscription_income',
            creditsConsumed: `-${publisherCommission}`, // Negative to indicate income
            createdAt: new Date()
          });
        }
      }

      console.log(`Credit transaction completed successfully`);
      return true;
    });
  }
}
