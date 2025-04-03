import { verifyJWT } from '@/lib/jwt';
import { channels, channelWorkflows, db, messages } from '@/lib/schema';
import { Channel, ChannelsResponse } from '@/lib/types';
import { NextResponse } from 'next/server';
import { and, eq, or, sql, like, desc, asc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json<ChannelsResponse>(
        { data: [], error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const workflowDefinitionId = searchParams.get('workflowDefinitionId');

    // 基础查询条件
    const baseConditions = [
      or(eq(channels.userId, jwtSub.userId), eq(channels.isPublic, true))
    ];

    // 构建基本选择字段
    const selectFields = {
      id: channels.id,
      channelId: channels.channelId,
      userId: channels.userId,
      dataType: channels.dataType,
      dataId: channels.dataId,
      metadata: channels.metadata,
      isPublic: channels.isPublic,
      isFree: channels.isFree,
      subscriptionFee: channels.subscriptionFee,
      lastSyncedAt: channels.lastSyncedAt,
      status: channels.status,
      createdAt: channels.createdAt,
      updatedAt: channels.updatedAt,
      // 获取每个频道的最新消息时间戳
      lastMessageAt: sql<number>`(
        SELECT MAX(${messages.messageTimestamp})
        FROM ${messages}
        WHERE ${messages.channelId} = ${channels.channelId}
      )`
    };

    let query;
    let countQuery;

    if (workflowDefinitionId) {
      // 如果指定了工作流，加入 channelWorkflows 表连接
      query = db
        .select(selectFields)
        .from(channels)
        .innerJoin(
          channelWorkflows,
          and(
            eq(channels.channelId, channelWorkflows.channelId),
            eq(channelWorkflows.workflowDefinitionId, workflowDefinitionId)
          )
        )
        .innerJoin(messages, eq(channels.channelId, messages.channelId))
        .where(and(...baseConditions))
        .groupBy(channels.id)
        .orderBy(
          desc(sql<number>`(
          SELECT MAX(${messages.messageTimestamp})
          FROM ${messages}
          WHERE ${messages.channelId} = ${channels.channelId}
        )`)
        );
    } else {
      // 不指定工作流，返回所有频道
      query = db
        .select(selectFields)
        .from(channels)
        .innerJoin(messages, eq(channels.channelId, messages.channelId))
        .where(and(...baseConditions))
        .groupBy(channels.id)
        .orderBy(
          desc(sql<number>`(
          SELECT MAX(${messages.messageTimestamp})
          FROM ${messages}
          WHERE ${messages.channelId} = ${channels.channelId}
        )`)
        );
    }

    // 执行查询获取所有数据
    const channelsData = await query;
    const totalCount = channelsData.length;

    return NextResponse.json<ChannelsResponse>({
      data: channelsData as Channel[],
      totalCount
    });
  } catch (error) {
    console.error('Error fetching subscriber channels:', error);
    return NextResponse.json<ChannelsResponse>(
      { data: [], error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
