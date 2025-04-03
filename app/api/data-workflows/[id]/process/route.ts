import { verifyJWT } from '@/lib/jwt';
import { dataWorkflowProcessor } from '@/lib/processors';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token =
      request.headers.get('Authorization')?.replace('Bearer ', '') || '';
    const jwtSub = await verifyJWT(token);

    if (!jwtSub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Start async processing but don't wait for completion
    processWorkflowAsync(id);

    return NextResponse.json({
      success: true,
      message: 'Workflow processing started'
    });
  } catch (error) {
    console.error('Error processing workflow:', error);
    if (
      error instanceof Error &&
      error.message.includes('Insufficient credits')
    ) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    return NextResponse.json(
      { error: 'Failed to process workflow' },
      { status: 500 }
    );
  }
}

// Async processing function to handle large workflows
async function processWorkflowAsync(workflowId: string) {
  try {
    // Using the existing processWorkflow method with manual run option
    await dataWorkflowProcessor.processWorkflow(workflowId, {
      isManualRun: true
    });

    console.log(`Workflow ${workflowId} processed successfully`);
  } catch (error) {
    console.error(`Error processing workflow ${workflowId}:`, error);
  }
}
