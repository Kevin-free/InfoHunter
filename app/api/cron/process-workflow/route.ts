import { dataWorkflowProcessor } from '@/lib/processors';
import { NextRequest, NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';

async function handler(request: NextRequest) {
  try {
    const definitionId = request.nextUrl.searchParams.get('definitionId');
    if (!definitionId) {
      return NextResponse.json(
        { error: 'Definition ID is required' },
        { status: 400 }
      );
    }
    await dataWorkflowProcessor.processWorkflow(definitionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing workflows:', error);
    if (
      error instanceof Error &&
      error.message.includes('Insufficient credits')
    ) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json(
      { error: 'Failed to process workflows' },
      { status: 500 }
    );
  }
}

export const GET = verifySignatureAppRouter(handler);

// 配置路由以接受原始请求体
export const config = {
  api: {
    bodyParser: false
  }
};
