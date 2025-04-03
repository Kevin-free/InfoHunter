import { Client } from '@upstash/qstash';

export class QStashService {
  private client: Client;
  private baseUrl: string;

  constructor() {
    this.client = new Client({
      token: process.env.QSTASH_TOKEN!
    });
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URI!;
  }

  async createWorkflowSchedule(
    definitionId: string,
    refreshIntervalHours: number
  ) {
    try {
      // convert refreshIntervalHours to cron expression
      const cronExpression = `0 */${refreshIntervalHours} * * *`;
      const schedule = await this.client.schedules.create({
        cron: cronExpression,
        destination: `${this.baseUrl}/api/cron/process-workflow?definitionId=${definitionId}`,
        method: 'GET'
      });

      return schedule;
    } catch (error) {
      console.error('Failed to create QStash schedule:', error);
      throw error;
    }
  }

  async deleteWorkflowSchedule(scheduleId: string) {
    try {
      await this.client.schedules.delete(scheduleId);
    } catch (error) {
      console.error('Failed to delete QStash schedule:', error);
      throw error;
    }
  }

  async pauseWorkflowSchedule(scheduleId: string) {
    try {
      await this.client.schedules.pause({ schedule: scheduleId });
    } catch (error) {
      console.error('Failed to pause QStash schedule:', error);
      throw error;
    }
  }

  async resumeWorkflowSchedule(scheduleId: string) {
    try {
      await this.client.schedules.resume({ schedule: scheduleId });
    } catch (error) {
      console.error('Failed to resume QStash schedule:', error);
      throw error;
    }
  }

  async updateWorkflowSchedule(
    scheduleId: string,
    definitionId: string,
    cronExpression: string
  ) {
    try {
      await this.client.schedules.create({
        scheduleId,
        cron: cronExpression,
        destination: `${this.baseUrl}/api/cron/process-workflow?definitionId=${definitionId}`,
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to update QStash schedule:', error);
      throw error;
    }
  }

  async createSyncGroupSchedule(tgId: string, syncIntervalHours: number) {
    try {
      const cronExpression = `0 */${syncIntervalHours} * * *`;
      const schedule = await this.client.schedules.create({
        cron: cronExpression,
        destination: `${this.baseUrl}/api/cron/sync-group?tgId=${tgId}`,
        method: 'GET'
      });

      return schedule;
    } catch (error) {
      console.error('Failed to create QStash schedule:', error);
      throw error;
    }
  }

  async deleteSyncGroupSchedule(scheduleId: string) {
    try {
      await this.client.schedules.delete(scheduleId);
    } catch (error) {
      console.error('Failed to delete QStash schedule:', error);
      throw error;
    }
  }

  async pauseSyncGroupSchedule(scheduleId: string) {
    try {
      await this.client.schedules.pause({ schedule: scheduleId });
    } catch (error) {
      console.error('Failed to pause QStash schedule:', error);
      throw error;
    }
  }

  async resumeSyncGroupSchedule(scheduleId: string) {
    try {
      await this.client.schedules.resume({ schedule: scheduleId });
    } catch (error) {
      console.error('Failed to resume QStash schedule:', error);
      throw error;
    }
  }

  async updateSyncGroupSchedule(
    scheduleId: string,
    tgId: string,
    intervalHours: number
  ) {
    try {
      const cronExpression = `0 */${intervalHours} * * *`;
      await this.client.schedules.create({
        scheduleId,
        cron: cronExpression,
        destination: `${this.baseUrl}/api/cron/sync-group?tgId=${tgId}`,
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to update QStash schedule:', error);
      throw error;
    }
  }
}

export const qstashService = new QStashService();
