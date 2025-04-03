import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { db, users } from '@/lib/schema';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    const jwtSub = await verifyJWT(token || '');

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db
      .select({
        userId: users.userId,
        username: users.username,
        displayName: users.displayName,
        photoUrl: users.photoUrl
      })
      .from(users);

    return Response.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return Response.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
