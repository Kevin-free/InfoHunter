import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class TempFileManager {
  private static async createTempDir(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), 'data-workflow-temp');
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  }

  static async writeTempFile(
    workflowDefinitionId: string,
    channelId: string,
    content: any
  ): Promise<string> {
    const tempDir = await this.createTempDir();
    const fileName = `workflow_${workflowDefinitionId}_channel_${channelId}.json`;
    const filePath = path.join(tempDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(content, null, 2));
    return filePath;
  }

  static async readTempFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  static async cleanupTempFiles(workflowDefinitionId: string): Promise<void> {
    const tempDir = await this.createTempDir();
    const files = await fs.readdir(tempDir);

    for (const file of files) {
      if (file.startsWith(`workflow_${workflowDefinitionId}_`)) {
        await fs.unlink(path.join(tempDir, file));
      }
    }
  }
}
