import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/schema';
import { verifyJWT } from '@/lib/jwt';
import { eq, not } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const username = url.searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // 检查用户名是否已被占用（排除当前用户）
    const existingUser = await db
      .select({ userId: users.userId })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    // 如果没有找到用户，或者找到的用户是当前用户，则用户名可用
    const available =
      existingUser.length === 0 ||
      (existingUser.length === 1 && existingUser[0].userId === jwtSub.userId);

    return NextResponse.json({ available });
  } catch (error) {
    console.error('Error checking username availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
