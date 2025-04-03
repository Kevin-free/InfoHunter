import { verifyJWT } from '@/lib/jwt';
import { channels, db, apikeys } from '@/lib/schema';
import { Channel, ChannelsResponse } from '@/lib/types';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { and, eq } from 'drizzle-orm';
import { verifyApiKey } from '@/lib/auth';

// publish channel: insert or update channel in database
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    let userId: string | null = null;

    // Handle both JWT and API key authentication
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
      // console.log('--- JWT userId', userId);
    } else if (authHeader.startsWith('sk-curifi-')) {
      // Verify API key and get user_id
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

    const channelsToSave = await request.json();

    console.log('---channelsToSave', channelsToSave);

    // Validate request parameters
    if (!Array.isArray(channelsToSave) || channelsToSave.length === 0) {
      return NextResponse.json(
        {
          code: 400,
          message: 'Invalid request: channels array is required',
          data: null
        },
        { status: 400 }
      );
    }

    const results = {
      channel_id: [] as string[],
      errors: [] as { channel_id: string; err_msg: string }[]
    };

    await Promise.all(
      channelsToSave.map(async (channel: any) => {
        try {
          // Validate required fields
          if (!channel.channel_type || !channel.platform_id) {
            throw new Error(
              'Missing required fields: channel_type, platform_id, or metadata'
            );
          }

          // Format channel_id
          const channelId = `${userId}:${channel.channel_type}:${channel.platform_id}`;

          await db
            .insert(channels)
            .values({
              channelId,
              userId,
              dataType: channel.channel_type,
              dataId: channel.platform_id,
              metadata: channel.metadata || {},
              isPublic: channel.is_public === true,
              isFree: channel.is_free === true,
              subscriptionFee: channel.subscription_fee,
              lastSyncedAt: new Date(),
              status: 'watching'
            })
            .onConflictDoUpdate({
              target: [channels.userId, channels.dataId],
              set: {
                isPublic: channel.is_public === true,
                isFree: channel.is_free === true,
                subscriptionFee: channel.subscription_fee,
                lastSyncedAt: new Date(),
                updatedAt: new Date()
              }
            });

          results.channel_id.push(channelId);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          const failedChannelId = `${userId}:${channel.channel_type}:${channel.platform_id}`;

          results.errors.push({
            channel_id: failedChannelId,
            err_msg: errorMessage
          });
        }
      })
    );

    return NextResponse.json({
      code: 200,
      message: 'success',
      data: results
    });
  } catch (error) {
    console.error('Error saving channels:', error);
    return NextResponse.json(
      {
        code: 500,
        message: 'Failed to save channels',
        data: null
      },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);

    const dataId = searchParams.get('dataId');

    const conditions = [eq(channels.userId, jwtSub.userId)];
    if (dataId) {
      conditions.push(eq(channels.dataId, dataId));
    }

    const channelsData = await db
      .select()
      .from(channels)
      .where(and(...conditions));

    return NextResponse.json<ChannelsResponse>({
      data: channelsData as Channel[]
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json<ChannelsResponse>(
      { data: [], error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
