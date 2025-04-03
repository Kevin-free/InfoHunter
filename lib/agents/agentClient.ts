import { ChatCompletionMessage } from '@/lib/types';
import { CreditService } from '../services/creditService';
import {
  calculateOpenRouterCredits,
  formatForDecimalStorage
} from '../utils/creditCalculator';
import { WorkflowService } from '../services/workflowService';
import { Decimal } from 'decimal.js';

interface AgentClientConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class AgentClient {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: AgentClientConfig) {
    // Get environment variables
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL;

    // Check for required API key
    if (!config.apiKey && !OPENROUTER_API_KEY) {
      throw new Error(
        'OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or provide it in the config.'
      );
    }

    this.apiKey = config.apiKey || OPENROUTER_API_KEY || '';
    this.baseUrl =
      config.baseUrl || OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    // Check for model
    if (!config.defaultModel && !OPENROUTER_MODEL) {
      throw new Error(
        'OpenRouter model is required. Set OPENROUTER_MODEL environment variable or provide it in the config.'
      );
    }

    this.defaultModel =
      config.defaultModel ||
      OPENROUTER_MODEL ||
      'google/gemini-2.0-flash-exp:free';
  }

  async chatCompletion(
    userId: string,
    messages: ChatCompletionMessage[],
    model?: string,
    temperature = 0.7,
    workflowDefinitionId?: string,
    from?: string
  ) {
    try {
      // check user credit < 0
      const userCredit = await CreditService.getUserCredit(userId);
      if (userCredit < 0) {
        throw new Error('Insufficient credits');
      }

      console.log('Sending request to OpenRouter:', {
        model: model || this.defaultModel,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content.substring(0, 50) + '...'
        }))
      });

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'HTTP-Referer':
            process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          messages,
          temperature,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}\n${errorText}`
        );
      }

      const data = await response.json();
      console.log('OpenRouter response:', data);

      if (!data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error(`Invalid API response: ${JSON.stringify(data)}`);
      }

      // Calculate AI usage credits
      const usedModel = model || this.defaultModel;
      const aiCreditsToDeduct = calculateOpenRouterCredits(data, usedModel);

      // Calculate total credits to deduct (AI + subscription fee)
      let totalCreditsToDeduct = aiCreditsToDeduct;
      let sumSubscriptionFee = new Decimal(0);
      let channelOwners: { userId: string; subscriptionFee: string }[] = [];

      // Deduct sum of subscription fee if workflowDefinitionId is provided and from is collection
      if (workflowDefinitionId && from === 'collection') {
        try {
          // 获取工作流关联的渠道订阅费用总和
          sumSubscriptionFee =
            await WorkflowService.getWorkflowSubscriptionFee(
              workflowDefinitionId
            );

          if (sumSubscriptionFee.greaterThan(0)) {
            totalCreditsToDeduct = totalCreditsToDeduct.add(sumSubscriptionFee);
            // 获取渠道所有者和各自的订阅费用
            const channelsWithFees =
              await WorkflowService.getWorkflowChannelsWithFees(
                workflowDefinitionId
              );

            // 转换为所需格式
            channelOwners = channelsWithFees.map((channel) => ({
              userId: channel.userId,
              subscriptionFee: channel.subscriptionFee
            }));
          }
        } catch (error) {
          console.error(
            'Error fetching workflow subscription fees from database:',
            error
          );
          // Continue with just the AI credits if we can't get the subscription fee
        }
      }

      // Process credits in a single transaction
      if (
        workflowDefinitionId &&
        from === 'collection' &&
        channelOwners.length > 0
      ) {
        console.log(
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              action: 'workflow_credits_distribution',
              userId,
              workflowId: workflowDefinitionId,
              model: usedModel,
              aiCredits: aiCreditsToDeduct.toString(),
              subscriptionFees: sumSubscriptionFee.toString(),
              totalAmount: totalCreditsToDeduct.toString(),
              publisherCount: channelOwners.length,
              publishers: channelOwners.map((p) => ({
                id: p.userId,
                fee: p.subscriptionFee
              })),
              from
            },
            null,
            2
          )
        );

        await CreditService.processWorkflowCredits(
          userId,
          formatForDecimalStorage(totalCreditsToDeduct),
          aiCreditsToDeduct,
          usedModel,
          workflowDefinitionId,
          channelOwners
        );
      } else {
        console.log(
          JSON.stringify(
            {
              timestamp: new Date().toISOString(),
              action: 'standard_credit_deduction',
              userId,
              workflowId: workflowDefinitionId || 'none',
              model: usedModel,
              aiCredits: aiCreditsToDeduct.toString(),
              subscriptionFees: sumSubscriptionFee.toString(),
              totalAmount: totalCreditsToDeduct.toString(),
              from: from || 'direct',
              reason:
                workflowDefinitionId && channelOwners.length === 0
                  ? 'no_publishers_found'
                  : 'standard_request'
            },
            null,
            2
          )
        );

        // Fall back to standard deduction if no publisher credits to process
        await CreditService.deductCredits(
          userId,
          formatForDecimalStorage(totalCreditsToDeduct),
          usedModel,
          workflowDefinitionId || ''
        );
      }

      return {
        content: data.choices[0].message.content,
        confidence: calculateConfidence(data),
        reason: extractReason(data.choices[0].message.content),
        creditsUsed: totalCreditsToDeduct
      };
    } catch (error) {
      console.error('Chat completion error:', error);
      throw error;
    }
  }
}

function calculateConfidence(response: any): number {
  // Implement confidence calculation based on response
  // This is a simplified example
  return (
    Math.min(
      Math.max(response.choices[0].finish_reason === 'stop' ? 0.8 : 0.5, 0),
      1
    ) * 100
  );
}

function extractReason(content: string): string {
  // Implement reason extraction from content
  // This is a simplified example
  return content.split('\nReason: ').pop()?.split('\n')[0] || '';
}
