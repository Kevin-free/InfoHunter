import { verifyJWT } from '@/lib/jwt';
import { channels, db } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 使用 await 解析 params
    const { chatId } = await params;

    // 从数据库获取频道信息
    const channel = await db
      .select()
      .from(channels)
      .where(and(eq(channels.dataId, chatId)))
      .limit(1);

    if (!channel || channel.length === 0) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // 获取查询到的频道
    const channelData = channel[0];

    // 权限检查逻辑
    const isOwner = channelData.userId === jwtSub.userId;
    const isPublic = channelData.isPublic === true;

    // 检查访问权限
    if (isOwner || isPublic) {
      return NextResponse.json({ data: channelData });
    } else {
      // 如果既不是所有者，频道也不是公开的，则拒绝访问
      return NextResponse.json(
        { error: 'You do not have permission to access this channel' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('Error fetching channel details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel details' },
      { status: 500 }
    );
  }
}
