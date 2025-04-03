import { messages, db } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const channelId = (await params).channelId;

  if (!channelId) {
    return NextResponse.json({ messageIds: [] });
  }

  const pinnedMessages = await db
    .select({
      id: messages.id,
      messageId: messages.messageId
    })
    .from(messages)
    .where(and(eq(messages.channelId, channelId), eq(messages.isPinned, true)));

  const messageIds = pinnedMessages.map((msg) => msg.messageId);

  return NextResponse.json({ messageIds });
}
