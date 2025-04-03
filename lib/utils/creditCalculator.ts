import { MODEL_PRICING } from '../constants/models';
import Decimal from 'decimal.js';

/**
 * 计算 OpenRouter 使用的信用额度
 * @param response OpenRouter API 响应
 * @param model 模型名称
 * @returns 信用额度数值（Decimal实例）
 */
export function calculateOpenRouterCredits(
  response: OpenRouterResponse,
  model: string
): Decimal {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];

  // 从 response 中获取 token 使用量
  const promptTokens = response.usage.prompt_tokens;
  const completionTokens = response.usage.completion_tokens;

  // 使用 Decimal 进行精确计算
  const inputCost = new Decimal(promptTokens)
    .div(1_000_000)
    .mul(pricing.inputPrice);
  const outputCost = new Decimal(completionTokens)
    .div(1_000_000)
    .mul(pricing.outputPrice);

  // 返回 Decimal 实例
  return inputCost.add(outputCost);
}

/**
 * 将 Decimal 转换为适合数据库 decimal 类型存储的字符串
 * @param value Decimal 实例
 * @returns 格式化后的字符串
 */
export function formatForDecimalStorage(value: Decimal): string {
  return value.toFixed(6); // 保留6位小数，适合数据库存储
}

/**
 * 将信用额度格式化为显示给用户的字符串
 * @param value Decimal 实例
 * @param currency 货币符号，默认为$
 * @returns 格式化后的显示字符串
 */
export function formatCreditsForDisplay(
  value: Decimal,
  currency: string = '$'
): string {
  return `${currency}${value.toFixed(4)}`;
}

/**
 * 为了与其他返回 number 的函数兼容，提供转换方法
 * @param value Decimal 实例
 * @returns 转换后的 number 值
 */
export function toNumber(value: Decimal): number {
  return value.toNumber();
}

// OpenRouter API 响应类型
interface OpenRouterResponse {
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  // ... 其他字段
}
