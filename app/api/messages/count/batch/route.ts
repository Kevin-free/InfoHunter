import { messages, db } from '@/lib/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { channelIds } = await request.json();

    if (!channelIds || !Array.isArray(channelIds) || !channelIds.length) {
      return NextResponse.json({ counts: {} });
    }

    // Get message counts for multiple channels
    const result = await db
      .select({
        channelId: messages.channelId,
        count: sql<number>`count(*)::int`
      })
      .from(messages)
      .where(inArray(messages.channelId, channelIds))
      .groupBy(messages.channelId);

    // Convert to a map of channelId -> count
    const counts = result.reduce(
      (acc, item) => {
        acc[item.channelId] = item.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({ counts });
  } catch (error) {
    console.error('Error fetching message counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message counts' },
      { status: 500 }
    );
  }
}
