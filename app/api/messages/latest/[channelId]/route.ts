import { messages, db } from '@/lib/schema';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const channelId = (await params).channelId;
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!channelId) {
    return NextResponse.json({ messages: [] });
  }

  const latestMessages = await db
    .select({
      id: messages.id,
      messageId: messages.messageId,
      messageText: messages.messageText,
      messageTimestamp: messages.messageTimestamp,
      buttons: messages.buttons,
      reactions: messages.reactions
    })
    .from(messages)
    .where(eq(messages.channelId, channelId))
    .orderBy(desc(messages.messageTimestamp))
    .limit(limit);

  return NextResponse.json({ messages: latestMessages });
}
