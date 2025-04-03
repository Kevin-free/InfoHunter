import { NextResponse } from 'next/server';
import { channels, db, messages } from '@/lib/schema';
import { verifyJWT } from '@/lib/jwt';
import { verifyApiKey } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    let userId: string | null = null;

    // 处理JWT或API key认证
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const jwtSub = await verifyJWT(token);
      if (!jwtSub) {
        return NextResponse.json(
          {
            code: 401,
            message: 'Unauthorized',
            data: null
          },
          { status: 401 }
        );
      }
      userId = jwtSub.userId;
    } else if (authHeader.startsWith('sk-curifi-')) {
      userId = await verifyApiKey(authHeader);
      // console.log('--- API key userId', userId);
      if (!userId) {
        return NextResponse.json(
          {
            code: 401,
            message: 'Invalid API key',
            data: null
          },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        {
          code: 401,
          message: 'Invalid authorization header',
          data: null
        },
        { status: 401 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { syncedMessages } = await request.json();

    // 验证请求参数
    if (
      !syncedMessages ||
      !Array.isArray(syncedMessages) ||
      syncedMessages.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid messages data' },
        { status: 400 }
      );
    }

    const totalMessageCount = syncedMessages.length;

    // 验证用户只能发送消息到自己的频道并格式化消息
    const validMessages = [];
    for (const msg of syncedMessages) {
      // 支持snake_case或camelCase属性命名
      const channelId = msg.channel_id || msg.channelId;
      if (!channelId) continue;

      // 频道ID格式：$user_id:$channel_type:$platform_id
      const channelUserId = channelId.split(':')[0];

      if (channelUserId === userId) {
        // 转换消息格式以匹配数据库列名
        validMessages.push({
          messageId: msg.message_id || msg.messageId,
          channelId: channelId,
          chatId: msg.chat_id || msg.chatId,
          messageText: msg.message_text || msg.messageText,
          messageTimestamp: msg.message_timestamp || msg.messageTimestamp,
          senderId: msg.sender_id || msg.senderId || '',
          sender: msg.sender || {},
          replyTo: msg.reply_to || msg.replyTo,
          topicId: msg.topic_id || msg.topicId,
          isPinned: msg.is_pinned || msg.isPinned || false,
          buttons: msg.buttons || [],
          reactions: msg.reactions || [],
          mediaType: msg.media_type || msg.mediaType,
          mediaFileId: msg.media_file_id || msg.mediaFileId,
          mediaUrl: msg.media_url || msg.mediaUrl,
          mediaMetadata: msg.media_metadata || msg.mediaMetadata || {}
        });
      }
    }

    const syncedMessageCount = validMessages.length;

    if (syncedMessageCount === 0) {
      return NextResponse.json(
        {
          code: 403,
          message: 'No valid messages to process',
          data: {
            total_message_count: totalMessageCount,
            synced_message_count: 0
          }
        },
        { status: 403 }
      );
    }

    // 将消息分批插入，每批最多1000条
    const BATCH_SIZE = 1000;
    let insertedCount = 0;

    for (let i = 0; i < validMessages.length; i += BATCH_SIZE) {
      const batch = validMessages.slice(i, i + BATCH_SIZE);
      await db
        .insert(messages)
        .values(batch)
        .onConflictDoNothing({
          target: [messages.channelId, messages.messageId]
        });
      insertedCount += batch.length;
    }

    // 仅更新一次channel的最后同步时间
    if (validMessages.length > 0) {
      await db
        .update(channels)
        .set({ lastSyncedAt: new Date() })
        .where(eq(channels.channelId, validMessages[0].channelId));
    }

    // 返回同步结果
    return NextResponse.json({
      code: 200,
      message: 'success',
      data: {
        total_message_count: totalMessageCount,
        synced_message_count: syncedMessageCount
      }
    });
  } catch (error) {
    console.error('Failed to batch insert messages:', error);
    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to process messages',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
