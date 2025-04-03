import { messages, db } from '@/lib/schema';
import { inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

// get messages by messageIds for pinned messages dialog
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageIds = searchParams.get('messageIds')?.split(',') || [];

  if (!messageIds.length) {
    return NextResponse.json({ messages: [] });
  }

  const returnedMessages = await db
    .select({
      id: messages.id,
      messageId: messages.messageId,
      messageText: messages.messageText,
      senderId: messages.senderId,
      messageTimestamp: messages.messageTimestamp
    })
    .from(messages)
    .where(inArray(messages.messageId, messageIds));

  return NextResponse.json({ messages: returnedMessages });
}
