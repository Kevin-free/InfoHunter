import { db, apikeys } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

/**
 * 验证API密钥并返回关联的用户ID
 * @param apiKey 要验证的API密钥
 * @returns 如果API密钥有效，则返回关联的用户ID；否则返回null
 */
export async function verifyApiKey(apiKey: string): Promise<string | null> {
  try {
    const result = await db
      .select({ userId: apikeys.userId })
      .from(apikeys)
      .where(and(eq(apikeys.apiKey, apiKey), eq(apikeys.status, 'active')))
      .limit(1);

    return result.length > 0 ? result[0].userId : null;
  } catch (error) {
    console.error('Error verifying API key:', error);
    return null;
  }
}
