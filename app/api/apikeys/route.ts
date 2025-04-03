import { NextRequest, NextResponse } from 'next/server';
import { db, apikeys } from '@/lib/schema';
import { verifyJWT } from '@/lib/jwt';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';

// GET: Get user's API keys
export async function GET(request: NextRequest) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userApiKeys = await db
      .select({
        id: apikeys.id,
        api_key: apikeys.apiKey,
        title: apikeys.title,
        user_id: apikeys.userId,
        created_at: apikeys.createdAt,
        status: apikeys.status
      })
      .from(apikeys)
      .where(eq(apikeys.userId, jwtSub.userId));

    return NextResponse.json({ apiKeys: userApiKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new API key
export async function POST(request: NextRequest) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    const { title } = requestData;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Generate API key with sk-curifi- prefix
    const uuid = uuidv4().replace(/-/g, '');
    const apiKey = `sk-curifi-${uuid}`;

    const [result] = await db
      .insert(apikeys)
      .values({
        apiKey: apiKey,
        title,
        userId: jwtSub.userId,
        createdAt: new Date(),
        status: 'active'
      })
      .returning({
        id: apikeys.id,
        api_key: apikeys.apiKey,
        title: apikeys.title,
        user_id: apikeys.userId,
        created_at: apikeys.createdAt,
        status: apikeys.status
      });

    return NextResponse.json({ apiKey: result });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
