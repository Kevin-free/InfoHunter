import { NextRequest, NextResponse } from 'next/server';
import { apikeys, db } from '@/lib/schema';
import { verifyJWT } from '@/lib/jwt';
import { eq, and } from 'drizzle-orm';

// DELETE: Delete a specific API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Ensure user can only delete their own API keys
    const result = await db
      .delete(apikeys)
      .where(
        and(eq(apikeys.id, parseInt(id)), eq(apikeys.userId, jwtSub.userId))
      )
      .returning({ id: apikeys.id });

    if (result.length === 0) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
