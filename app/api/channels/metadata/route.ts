import { verifyJWT } from '@/lib/jwt';
import { channels, db } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { channelUpdates } = await request.json();

    if (!Array.isArray(channelUpdates) || channelUpdates.length === 0) {
      return NextResponse.json(
        { error: 'Invalid channel updates data' },
        { status: 400 }
      );
    }

    // Process each channel update
    const results = [];
    for (const update of channelUpdates) {
      const { dataId, metadata } = update;

      if (!dataId || !metadata) {
        results.push({
          dataId,
          success: false,
          error: 'Missing required fields'
        });
        continue;
      }

      try {
        // First, get the current channel data to preserve the photo
        const currentChannel = await db
          .select({ metadata: channels.metadata })
          .from(channels)
          .where(eq(channels.dataId, dataId))
          .then((rows) => rows[0]);

        // Merge the new metadata with existing metadata, ensuring photo is preserved
        const mergedMetadata = {
          ...metadata,
          // If current channel has photo in metadata, preserve it
          photo:
            (currentChannel?.metadata as { photo?: string | null })?.photo ||
            null
        };

        // Update the channel metadata in the database
        await db
          .update(channels)
          .set({
            metadata: mergedMetadata,
            lastSyncedAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(channels.dataId, dataId));

        results.push({ dataId, success: true });
      } catch (error) {
        console.error(`Error updating channel ${dataId}:`, error);
        results.push({
          dataId,
          success: false,
          error:
            error instanceof Error ? error.message : 'Database update failed'
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Failed to update channel metadata:', error);
    return NextResponse.json(
      { error: 'Failed to update channel metadata' },
      { status: 500 }
    );
  }
}
