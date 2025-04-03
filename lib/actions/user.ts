'use server';

import { db, users, userCredits } from '../schema';
import { eq } from 'drizzle-orm';
import {
  INITIAL_USER_CREDITS,
  INITIAL_USER_WORKFLOWS
} from '@/lib/constants/plans';

interface UserType {
  userId: string;
  username?: string;
  isAdmin?: boolean;
  displayName?: string;
  photoUrl?: string;
  email?: string;
}

export async function createAndUpdateUsers({
  userId,
  isAdmin,
  photoUrl,
  email,
  username,
  displayName
}: UserType) {
  try {
    // 开启事务
    return await db.transaction(async (tx) => {
      // 插入/更新用户信息
      const result = await tx
        .insert(users)
        .values({
          userId,
          photoUrl,
          email,
          username,
          displayName,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: new Date(),
          isAdmin: isAdmin
        })
        .onConflictDoUpdate({
          target: users.userId,
          set: {
            photoUrl,
            email,
            displayName,
            updatedAt: new Date(),
            lastLoginAt: new Date(),
            isAdmin
          }
        })
        .returning();

      // 检查是否存在积分记录
      const existingCredits = await tx
        .select()
        .from(userCredits)
        .where(eq(userCredits.userId, userId))
        .limit(1);

      // 如果不存在积分记录,添加初始积分
      if (existingCredits.length === 0) {
        const initialCredits = Number(
          process.env.INITIAL_CREDITS || INITIAL_USER_CREDITS
        );
        const initialWorkflows = Number(
          process.env.INITIAL_WORKFLOWS || INITIAL_USER_WORKFLOWS
        );

        await tx.insert(userCredits).values({
          userId,
          credits: initialCredits.toString(),
          workflows: initialWorkflows,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return result.length > 0 ? result[0] : null;
    });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw new Error('Failed to create or update user.');
  }
}

export async function getUserById(userId: string) {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    return user.length > 0 ? user[0] : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

// type EmailLoginType = {
//   email: string;
//   password: string;
// };

// export async function emailLogin({ email }: EmailLoginType) {
//   try {
//     const emailRes = await createAndUpdateUsers({
//       userId: email,
//       username: email,
//       isAdmin: true
//     });

//     // 临时注释掉 getJWT 调用，使用模拟 token
//     const token = await getJWT({
//       isAdmin: true,
//       userId: emailRes?.id!,
//       userKey: emailRes?.userId!,
//       userKeyType: 'email'
//     });

//     // const mockToken = 'mock_token_' + Date.now();

//     return {
//       code: 0,
//       data: {
//         token: token,
//         user: {
//           userId: emailRes?.id || '',
//           userKey: emailRes?.userId || '',
//           userKeyType: 'email',
//           isAdmin: true
//         }
//       }
//     };
//   } catch (error) {
//     console.error('Error email user:', error);
//     throw new Error('Failed to create or update user.');
//   }
// }
