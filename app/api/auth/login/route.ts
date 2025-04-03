import { NextRequest } from 'next/server';
import { getJWT } from '@/lib/jwt';
import { createAndUpdateUsers } from '@/lib/actions/user';
import { getIsAdmin } from '@/lib/utils';
import { getUserById } from '@/lib/actions/user';

/**
 * @param request: { tokenId: string }
 * @returns { code: number, data: {token: string} }
 */
export async function POST(request: NextRequest) {
  const requestBody = await request.json();

  const { userId, email, displayName, photoUrl, userKeyType } = requestBody;

  if (!userId || !email || !userKeyType) {
    return Response.json({
      code: -1,
      message: 'params error'
    });
  }

  try {
    const isAdmin = getIsAdmin(email);

    // 生成唯一用户名：displayName + _ + userId哈希后取4位
    const hashedUserId = require('crypto')
      .createHash('md5')
      .update(userId)
      .digest('hex')
      .substring(0, 8);

    // 去除displayName中的所有空格，并构建用户名
    const username = `user_${hashedUserId}`;

    // 先检查用户是否已存在
    const existingUser = await getUserById(userId);

    // 如果用户已存在，使用原有用户名；否则使用新生成的用户名
    const finalUsername = existingUser?.username || username;

    const user = await createAndUpdateUsers({
      userId,
      email,
      username: finalUsername,
      isAdmin,
      displayName,
      photoUrl
    });

    const token = await getJWT({
      userId: user?.userId!,
      userKey: finalUsername,
      userKeyType,
      isAdmin,
      displayName,
      photoUrl,
      email
    });

    return Response.json({
      code: 0,
      data: {
        token,
        isAdmin,
        username: finalUsername
      }
    });
  } catch (err) {
    console.log('Google login failed', err);
    return Response.json({
      code: -1,
      message: 'Google login failed'
    });
  }
}
