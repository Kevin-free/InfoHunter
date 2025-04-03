import { AgentClient } from '../agents/agentClient';
import { DataWorkflowProcessor } from './dataWorkflowProcessor';

const agentClient = new AgentClient({});

// 只有明确设置了TEST_MODE=true时才启用测试模式
const isTestMode = process.env.TEST_MODE === 'true';
const testLimit = parseInt(process.env.TEST_LIMIT || '2', 10);

export const dataWorkflowProcessor = new DataWorkflowProcessor(agentClient, {
  isTestMode,
  testLimit
});
