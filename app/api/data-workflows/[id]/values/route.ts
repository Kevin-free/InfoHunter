import { db, workflowValues, channels, channelWorkflows } from '@/lib/schema';
import { eq, and, not, desc, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const workflowDefinitionId = id;

    // 获取聚合结果 (isAggregated = true)
    const aggregateValues = await db
      .select()
      .from(workflowValues)
      .where(
        and(
          eq(workflowValues.workflowDefinitionId, workflowDefinitionId),
          eq(workflowValues.isAggregated, true)
        )
      )
      .orderBy(desc(workflowValues.updatedAt));

    // 获取分组结果 (isAggregated = false) 并关联channel元数据
    // 使用channelWorkflows作为中间表进行关联
    // const groupValues = await db
    //   .select({
    //     id: workflowValues.id,
    //     workflowValueId: workflowValues.workflowValueId,
    //     workflowDefinitionId: workflowValues.workflowDefinitionId,
    //     value: workflowValues.value,
    //     confidence: workflowValues.confidence,
    //     reason: workflowValues.reason,
    //     version: workflowValues.version,
    //     isAggregated: workflowValues.isAggregated,
    //     createdAt: workflowValues.createdAt,
    //     updatedAt: workflowValues.updatedAt,
    //     channelMetadata: channels.metadata
    //   })
    //   .from(workflowValues)
    //   .innerJoin(
    //     channelWorkflows,
    //     eq(
    //       workflowValues.workflowDefinitionId,
    //       channelWorkflows.workflowDefinitionId
    //     )
    //   )
    //   .leftJoin(channels, eq(channelWorkflows.channelId, channels.channelId))
    //   .where(
    //     and(
    //       eq(workflowValues.workflowDefinitionId, workflowDefinitionId),
    //       eq(workflowValues.isAggregated, false)
    //     )
    //   )
    //   .orderBy(desc(workflowValues.version));

    // 按版本分组
    const groupedAggregateValues = groupByVersion(aggregateValues);
    // const groupedGroupValues = groupByVersion(groupValues);

    return NextResponse.json({
      aggregateValues: groupedAggregateValues
      // groupValues: groupedGroupValues
    });
  } catch (error) {
    console.error('Error fetching workflow values:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow values' },
      { status: 500 }
    );
  }
}

function groupByVersion<T extends { version: number }>(values: T[]): T[][] {
  const grouped = values.reduce(
    (acc, value) => {
      const version = value.version;
      if (!acc[version]) {
        acc[version] = [];
      }
      acc[version].push(value);
      return acc;
    },
    {} as Record<number, T[]>
  );

  // Convert to array and sort by version descending
  return Object.entries(grouped)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([_, values]) => values);
}
