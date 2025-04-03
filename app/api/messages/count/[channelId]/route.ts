import { messages, db } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const channelId = (await params).channelId;

  if (!channelId) {
    return NextResponse.json({ count: 0 });
  }

  // Count messages for the specified channel
  const result = await db
    .select({ count: sql`COUNT(*)` })
    .from(messages)
    .where(eq(messages.channelId, channelId));

  const count = Number(result[0]?.count || 0);

  return NextResponse.json({ count });
}
