import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/r2';

// 并发上传的最大数量
const MAX_CONCURRENT_UPLOADS = 5;

// 并发处理函数
async function processConcurrent<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  concurrency = MAX_CONCURRENT_UPLOADS
): Promise<R[]> {
  const results: R[] = [];
  const inProgress = new Set<Promise<void>>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // 创建处理任务
    const task = (async () => {
      try {
        const result = await fn(item);
        results[i] = result; // 保持原始顺序
      } catch (error) {
        results[i] = error as R;
      }
    })();

    // 添加到进行中的任务
    inProgress.add(task);

    // 当任务完成时从集合中移除
    void task.then(() => {
      inProgress.delete(task);
    });

    // 如果并发数达到上限，等待一个任务完成
    if (inProgress.size >= concurrency) {
      await Promise.race(inProgress);
    }
  }

  // 等待所有剩余任务完成
  await Promise.all(inProgress);

  return results;
}

export async function POST(req: NextRequest) {
  try {
    // 解析请求体
    const body = await req.json();
    const { photos } = body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No photos to upload' },
        { status: 400 }
      );
    }

    // 并发处理上传
    const results = await processConcurrent(photos, async (item) => {
      try {
        // 转换base64为Buffer
        const base64Data = item.photo.replace(/^data:image\/\w+;base64,/, '');
        const photoBuffer = Buffer.from(base64Data, 'base64');

        // 上传到R2
        await uploadFile(photoBuffer, item.path);

        // 返回成功结果
        return {
          groupId: item.groupId,
          photoPath: item.path,
          success: true
        };
      } catch (error) {
        console.error(
          `Failed to upload photo for group ${item.groupId}:`,
          error
        );
        // 返回失败结果
        return {
          groupId: item.groupId,
          photoPath: null,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
    });

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error processing batch upload:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Batch upload failed'
      },
      { status: 500 }
    );
  }
}
