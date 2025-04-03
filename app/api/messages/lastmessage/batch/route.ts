import { db, messages } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { channelIds } = await req.json();

    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid channelIds parameter' },
        { status: 400 }
      );
    }

    // 查询每个 channel_id 最新的 message_timestamp
    const lastMessagesPromises = channelIds.map(async (channelId) => {
      const result = await db
        .select({
          channel_id: messages.channelId,
          last_message_time: sql<number>`MAX(message_timestamp)`
        })
        .from(messages)
        .where(eq(messages.channelId, channelId))
        .groupBy(messages.channelId);
      return result[0] || { channel_id: channelId, last_message_time: null };
    });

    const lastMessagesResults = await Promise.all(lastMessagesPromises);

    // 转换为所需格式
    const lastMessages: Record<string, number> = {};
    lastMessagesResults.forEach((result: any) => {
      lastMessages[result.channel_id] = result.last_message_time;
    });
    return NextResponse.json({ lastMessages });
  } catch (error) {
    console.error('Error fetching last message times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch last message times' },
      { status: 500 }
    );
  }
}
