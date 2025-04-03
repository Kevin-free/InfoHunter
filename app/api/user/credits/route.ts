import { verifyJWT } from '@/lib/jwt';
import { db } from '@/lib/schema';
import { userCredits } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtPayload = await verifyJWT(token || '');

    // if (!jwtPayload || jwtPayload.userId !== userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const result = await db
      .select({ credits: userCredits.credits })
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    const credits = result.length > 0 ? result[0].credits : 0;

    return NextResponse.json({ credits });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user credits' },
      { status: 500 }
    );
  }
}
