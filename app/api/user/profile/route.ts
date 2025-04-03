import { NextRequest, NextResponse } from 'next/server';
import { db, users } from '@/lib/schema';
import { verifyJWT } from '@/lib/jwt';
import { eq } from 'drizzle-orm';

// PUT: 更新用户个人资料
export async function PUT(request: NextRequest) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { displayName, username } = await request.json();
    const updateData: any = { updatedAt: new Date() };
    let updateType = '';

    // 检查是否有显示名称更新
    if (displayName && typeof displayName === 'string') {
      updateData.displayName = displayName;
      updateType = 'displayName';
    }

    // 检查是否有用户名更新
    if (username && typeof username === 'string') {
      // 检查用户名是否已被占用
      const existingUser = await db
        .select({ userId: users.userId })
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser.length > 0 && existingUser[0].userId !== jwtSub.userId) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        );
      }

      updateData.username = username;
      updateType = updateType ? 'profile' : 'username';
    }

    if (!updateType) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.userId, jwtSub.userId))
      .returning({
        userId: users.userId,
        username: users.username,
        displayName: users.displayName
      });

    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: result[0],
      message: `User ${updateType} updated successfully`
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
