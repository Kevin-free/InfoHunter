import { NextResponse } from 'next/server';
import { AgentClient } from '@/lib/agents/agentClient';
import { verifyJWT } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const agentClient = new AgentClient({});

    const generatedPrompt = await agentClient.chatCompletion(
      jwtSub.userId,
      [
        {
          role: 'system',
          content:
            'You are a data analysis prompt optimizer. Your task is to refine user prompts to be more specific and concise. ' +
            'Follow these rules:\n' +
            '1. Keep the core intent of the original prompt\n' +
            '2. Make it clear what data should be extracted\n' +
            '3. Be specific about the analysis required\n' +
            '4. Remove any unnecessary words\n' +
            '5. Keep the output under 200 characters when possible\n' +
            '6. Use clear, direct language'
        },
        {
          role: 'user',
          content: `Original prompt: ${prompt}\n\nPlease optimize this prompt for data extraction and analysis while keeping it concise.`
        }
      ],
      undefined,
      undefined,
      undefined,
      'generate-workflow-prompt'
    );

    return NextResponse.json({ prompt: generatedPrompt.content });
  } catch (error) {
    console.error('Generate workflow prompt error:', error);

    if (
      error instanceof Error &&
      error.message.includes('Insufficient credits')
    ) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }

    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    );
  }
}
