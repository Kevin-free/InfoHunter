import { StringSession } from '@/lib/browser/sessions';
import { TelegramClient } from '@/lib/browser/client/TelegramClient';
import { Api } from '@/lib/browser';
import { getJwt } from '@/components/lib/networkUtils';
import { LocalStorageService } from '../localStorageService';
import { Channel } from '@/lib/types';
import {
  updateChannelsMetadata,
  ChannelMetadataUpdate
} from '../services/channelService';

const STORAGE_KEY_PREFIX = 'telegram_session_';

export class TelegramWebService {
  private client: TelegramClient;
  private session: StringSession;

  constructor(sessionString: string) {
    const apiId = process.env.NEXT_PUBLIC_APPID;
    const apiHash = process.env.NEXT_PUBLIC_APP_HASH;

    if (!apiId || !apiHash) {
      throw new Error(
        'NEXT_PUBLIC_APPID or NEXT_PUBLIC_APP_HASH not found in environment variables'
      );
    }

    this.session = new StringSession(sessionString);
    this.client = new TelegramClient(this.session, Number(apiId), apiHash, {
      autoReconnect: true
    });
  }

  static saveSession(accountId: string, sessionData: string) {
    const key = `${STORAGE_KEY_PREFIX}${accountId}`;
    localStorage.setItem(key, sessionData);
  }

  static getSession(accountId: string): string | null {
    const key = `${STORAGE_KEY_PREFIX}${accountId}`;
    return localStorage.getItem(key);
  }

  static removeSession(accountId: string) {
    const key = `${STORAGE_KEY_PREFIX}${accountId}`;
    localStorage.removeItem(key);
  }

  async connect() {
    await this.client.connect();
    return this.client;
  }

  private async getGroupDescription(dialog: any): Promise<string> {
    try {
      if (dialog.entity.className === 'Channel') {
        const result = await this.client.invoke(
          new Api.channels.GetFullChannel({
            channel: dialog.entity
          })
        );
        return result.fullChat.about || '';
      } else {
        const result = await this.client.invoke(
          new Api.messages.GetFullChat({
            chatId: dialog.entity.id
          })
        );
        return result.fullChat.about || '';
      }
    } catch (error) {
      console.error('Failed to get group description:', error);
      return '';
    }
  }

  private async getParticipantsCount(dialog: any): Promise<number> {
    try {
      if (dialog.entity.participantsCount) {
        return dialog.entity.participantsCount;
      }
      const participants = await this.client.getParticipants(dialog.entity, {
        limit: 0
      });
      return participants.total || 0;
    } catch (error) {
      console.error('Failed to get participants count:', error);
      return 0;
    }
  }

  async disconnect() {
    await this.client.disconnect();
  }

  async syncGroupMetadata(limitDialogs?: number): Promise<{
    syncedGroups: number;
    status: string;
  }> {
    await this.connect();

    try {
      // 参数优先级处理：传入参数 > 环境变量 > 默认值
      let dialogLimit: number | undefined =
        limitDialogs !== undefined
          ? limitDialogs
          : process.env.NEXT_PUBLIC_LIMIT_DIALOGS
            ? Number(process.env.NEXT_PUBLIC_LIMIT_DIALOGS)
            : 0;

      // 如果 limitDialogs 为 0，则设置为 undefined
      if (dialogLimit === 0) {
        dialogLimit = undefined;
      }

      console.log('---syncGroupMetadata limitDialogs', dialogLimit);

      const dialogs = await this.client.getDialogs({ limit: dialogLimit });
      const me = await this.client.getMe();

      // 过滤出群组和频道
      const groupDialogs = dialogs.filter(
        (dialog) => dialog.isGroup || dialog.isChannel
      );
      const chatIds = groupDialogs
        .map((dialog) => dialog.entity?.id.toString() || '')
        .filter(Boolean);

      if (chatIds.length === 0) {
        return { syncedGroups: 0, status: 'success' };
      }

      // 获取现有的群组数据，用于保留 isPublished 和 isPublic 值
      const existingGroups = LocalStorageService.getGroups();

      // 并行获取所有群组的元数据
      const metadataPromises = groupDialogs.map(async (dialog) => {
        try {
          const chatId = dialog.entity?.id.toString() || '';
          const [description, participantsCount, photo, admins] =
            await Promise.all([
              this.getGroupDescription(dialog),
              this.getParticipantsCount(dialog),
              this.getGroupPhoto(dialog),
              this.getAdmins(dialog)
            ]);

          return {
            chatId,
            type: this.getGroupType(dialog),
            name: dialog.title || null,
            username: (dialog.entity as any)?.username || null,
            description,
            photo,
            participantsCount,
            admins
          };
        } catch (error) {
          console.error(
            'Error getting group metadata:',
            dialog.entity?.id,
            error
          );
          return null;
        }
      });

      // 使用 Promise.allSettled 确保即使部分失败也能继续处理
      const metadataResults = await Promise.allSettled(metadataPromises);
      const validMetadata = metadataResults
        .filter(
          (result): result is PromiseFulfilledResult<any> =>
            result.status === 'fulfilled' && result.value !== null
        )
        .map((result) => result.value);

      // 批量更新所有数据
      let updatedGroups = 0;

      for (const metadata of validMetadata) {
        try {
          // 查找现有群组
          const existingGroup = existingGroups.find(
            (group) => group.chatId === metadata.chatId
          );

          // 保存到 LocalStorage，保留现有的 isPublished 和 isPublic 值
          LocalStorageService.saveGroup({
            chatId: metadata.chatId,
            tgId: me.id.toString(),
            type: metadata.type,
            name: metadata.name,
            username: metadata.username,
            about: metadata.description,
            photo: metadata.photo,
            participantsCount: metadata.participantsCount,
            admins: metadata.admins,
            // 如果群组已存在，保留现有值；否则设置默认值
            isPublished: existingGroup ? existingGroup.isPublished : false,
            isPublic: existingGroup ? existingGroup.isPublic : false,
            isFree: existingGroup ? existingGroup.isFree : false,
            subscriptionFee: existingGroup
              ? existingGroup.subscriptionFee
              : '0',
            createdAt: existingGroup
              ? existingGroup.createdAt
              : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString()
          });

          // 添加到账户-群组映射
          LocalStorageService.addGroupToAccount(
            me.id.toString(),
            metadata.chatId
          );

          updatedGroups++;
        } catch (error) {
          console.error('Error updating group:', error);
        }
      }

      // Use API to update DB channels metadata where channels.data_id = chatId
      try {
        const channelUpdates: ChannelMetadataUpdate[] = validMetadata.map(
          (metadata) => ({
            dataId: metadata.chatId,
            metadata: {
              name: metadata.name,
              username: metadata.username,
              about: metadata.description,
              // photo: metadata.photo,
              participantsCount: metadata.participantsCount,
              type: metadata.type
            }
          })
        );

        if (channelUpdates.length > 0) {
          const result = await updateChannelsMetadata(channelUpdates);
          if (result.success) {
            console.log('Successfully updated channel metadata in database');
          } else {
            console.error(
              'Failed to update channel metadata in database:',
              result.error
            );
          }
        }
      } catch (error) {
        console.error('Error updating channel metadata in database:', error);
      }

      return {
        syncedGroups: updatedGroups,
        status: 'success'
      };
    } catch (error) {
      console.error('Failed to sync group metadata:', error);
      return {
        syncedGroups: 0,
        status: 'error'
      };
    }
  }

  async syncGroupMessages(limitMessages?: number): Promise<{
    syncedGroups: number;
    totalSyncedMessages: number;
    status: string;
  }> {
    await this.connect();

    try {
      // 参数优先级处理：传入参数 > 环境变量 > 默认值
      let messageLimit: number | undefined =
        limitMessages !== undefined
          ? limitMessages
          : process.env.NEXT_PUBLIC_LIMIT_MESSAGES
            ? Number(process.env.NEXT_PUBLIC_LIMIT_MESSAGES)
            : 0;

      // 修改这里：如果 messageLimit 为 undefined 或 0，则设置为 100 而不是 undefined
      // 这样可以避免获取所有消息导致长时间等待
      if (messageLimit === 0 || messageLimit === undefined) {
        messageLimit = 100; // 默认获取最新的100条消息
      }

      console.log('---syncGroupMessages limitMessages', messageLimit);

      const response = await fetch('/api/channels?isPublished=true', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getJwt()}`
        }
      });

      const { data: channels, error } = await response.json();

      if (error || !Array.isArray(channels)) {
        throw new Error(error || 'Invalid response format');
      }

      const chatIds = channels.map((channel: Channel) => channel.dataId);

      if (chatIds.length === 0) {
        return {
          syncedGroups: 0,
          totalSyncedMessages: 0,
          status: 'success'
        };
      }

      // 获取所有对话
      const dialogs = await this.client.getDialogs();

      const syncedMessages = [];
      let totalSyncedMessages = 0;

      // 遍历需要同步的chatIds
      for (const chatId of chatIds) {
        // 找到对应的dialog
        const dialog = dialogs.find((d) => d.entity?.id.toString() === chatId);
        if (!dialog?.entity) continue;

        // 找到对应的channel信息
        const channel = channels.find((c: any) => c.dataId === chatId);
        if (!channel) continue;

        // 添加随机延迟避免触发频率限制
        const delay = 2000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          const msgs = await this.client.getMessages(dialog.entity, {
            limit: messageLimit
          });

          for (const msg of msgs) {
            if (msg.message) {
              syncedMessages.push({
                messageId: msg.id.toString(),
                channelId: channel.channelId,
                chatId,
                messageText: msg.message,
                senderId: msg.senderId?.toString(),
                messageTimestamp: msg.date,
                replyTo: msg.replyTo?.replyToMsgId?.toString(),
                topicId: msg.replyTo?.replyToTopId?.toString(),
                isPinned: msg.pinned
              });
            }
          }
        } catch (error) {
          console.error(`Failed to get messages for group ${chatId}:`, error);
          continue;
        }
      }

      // Update messages through API
      if (syncedMessages.length > 0) {
        try {
          totalSyncedMessages += syncedMessages.length;
          const response = await fetch('/api/messages/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getJwt()}`
            },
            body: JSON.stringify({ syncedMessages })
          });

          if (!response.ok) {
            throw new Error('Failed to update messages');
          }
        } catch (error) {
          console.error('Failed to update messages:', error);
        }
      }

      // update local storage group lastSyncedAt
      LocalStorageService.updateGroupLastSyncedAt(chatIds);

      return {
        syncedGroups: chatIds.length,
        totalSyncedMessages,
        status: 'success'
      };
    } catch (error) {
      console.error('Failed to sync messages:', error);
      return {
        syncedGroups: 0,
        totalSyncedMessages: 0,
        status: 'error'
      };
    }
  }

  private getGroupType(dialog: any): string {
    const entity = dialog.entity;
    if (entity.className === 'Channel') {
      if (entity.megagroup) return 'mega_group';
      if (entity.gigagroup) return 'giga_group';
      return 'channel';
    }
    return 'group';
  }

  private async getAdmins(dialog: any): Promise<string> {
    try {
      const participants = await this.client.getParticipants(dialog.entity, {
        filter: new Api.ChannelParticipantsAdmins()
      });
      return participants.map((admin) => admin.id.toString()).join(',');
    } catch (error: any) {
      if (error.errorMessage === 'CHAT_ADMIN_REQUIRED') {
        console.log(
          `No permission to get admins for chat ${dialog.entity?.id}, using default admin ID`
        );
      } else {
        console.error('Unexpected error when getting admins:', error);
      }
      return 'permission_denied';
    }
  }

  private async getGroupPhoto(dialog: any): Promise<string | null> {
    try {
      if (!dialog.entity?.photo) {
        return null;
      }

      // 获取完整的照片对象
      const photo = await this.client.downloadProfilePhoto(dialog.entity, {
        isBig: false
      });

      if (!photo) {
        return null;
      }

      // 将 Buffer 转换为 base64 字符串
      const base64Photo = Buffer.from(photo).toString('base64');
      return `data:image/jpeg;base64,${base64Photo}`;
    } catch (error) {
      console.error('Failed to get group photo:', error);
      return null;
    }
  }

  async syncSingleGroupMetadata(chatId: string): Promise<{
    success: boolean;
    status: string;
    message?: string;
  }> {
    await this.connect();

    try {
      console.log(`Syncing metadata for group ${chatId}`);

      // Get all dialogs
      const dialogs = await this.client.getDialogs();
      const me = await this.client.getMe();

      // Find the specific dialog
      const dialog = dialogs.find((d) => d.entity?.id.toString() === chatId);

      if (!dialog?.entity) {
        return {
          success: false,
          status: 'error',
          message: 'Group not found in dialogs'
        };
      }

      // Get existing groups to preserve isPublished and isPublic values
      const existingGroups = LocalStorageService.getGroups();
      const existingGroup = existingGroups.find((g) => g.chatId === chatId);

      try {
        // Get group metadata
        const [description, photo, admins] = await Promise.all([
          this.getGroupDescription(dialog),
          this.getGroupPhoto(dialog),
          this.getAdmins(dialog)
        ]);

        const metadata = {
          chatId,
          type: this.getGroupType(dialog),
          name: dialog.title || null,
          username: (dialog.entity as any)?.username || null,
          description,
          photo,
          participantsCount: (dialog.entity as any)?.participantsCount || 0,
          admins: admins.split(',').map((admin: string) => admin.trim())
        };

        // Save to localStorage
        LocalStorageService.saveGroup({
          chatId: metadata.chatId,
          tgId: me.id.toString(),
          type: metadata.type,
          name: metadata.name,
          username: metadata.username,
          about: metadata.description,
          photo: metadata.photo,
          participantsCount: metadata.participantsCount,
          admins: metadata.admins,
          // Preserve existing values if available
          isPublished: existingGroup ? existingGroup.isPublished : false,
          isPublic: existingGroup ? existingGroup.isPublic : false,
          isFree: existingGroup ? existingGroup.isFree : false,
          subscriptionFee: existingGroup ? existingGroup.subscriptionFee : '0',
          createdAt: existingGroup
            ? existingGroup.createdAt
            : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastSyncedAt: new Date().toISOString()
        });

        // Add to account-group mapping
        LocalStorageService.addGroupToAccount(
          me.id.toString(),
          metadata.chatId
        );

        // Update DB if the group is published
        if (existingGroup?.isPublished) {
          try {
            const channelUpdate: ChannelMetadataUpdate = {
              dataId: metadata.chatId,
              metadata: {
                name: metadata.name,
                username: metadata.username,
                about: metadata.description,
                // photo: metadata.photo,
                participantsCount: metadata.participantsCount,
                type: metadata.type
              }
            };

            const result = await updateChannelsMetadata([channelUpdate]);
            if (!result.success) {
              console.error(
                'Failed to update channel metadata in database:',
                result.error
              );
            }
          } catch (error) {
            console.error(
              'Error updating channel metadata in database:',
              error
            );
          }
        }

        return {
          success: true,
          status: 'success',
          message: 'Group metadata synced successfully'
        };
      } catch (error) {
        console.error('Error getting group metadata:', error);
        return {
          success: false,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Failed to sync group metadata:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await this.disconnect();
    }
  }

  async syncSingleGroupMessages(
    chatId: string,
    limitMessages?: number
  ): Promise<{
    success: boolean;
    status: string;
    message?: string;
    syncedMessages?: number;
  }> {
    await this.connect();

    try {
      // Get message limit from params or env
      let messageLimit: number | undefined =
        limitMessages !== undefined
          ? limitMessages
          : process.env.NEXT_PUBLIC_LIMIT_MESSAGES
            ? Number(process.env.NEXT_PUBLIC_LIMIT_MESSAGES)
            : 0;

      // 修改这里：同样，如果 messageLimit 为 undefined 或 0，则设置为 100
      if (messageLimit === 0 || messageLimit === undefined) {
        messageLimit = 100; // 默认获取最新的100条消息
      }

      console.log(
        `Syncing messages for group ${chatId} messageLimit ${messageLimit}`
      );

      // Get channel info from API
      const response = await fetch(
        `/api/channels?dataId=${chatId}&isPublished=true`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          }
        }
      );

      const { data: channels } = await response.json();
      const channel = Array.isArray(channels) ? channels[0] : null;

      if (!channel) {
        return {
          success: false,
          status: 'error',
          message: 'Channel not found or not published'
        };
      }

      // Get dialogs and find the specific one
      const dialogs = await this.client.getDialogs();
      const dialog = dialogs.find((d) => d.entity?.id.toString() === chatId);

      if (!dialog?.entity) {
        return {
          success: false,
          status: 'error',
          message: 'Group not found in dialogs'
        };
      }

      // Get messages - now with a safe default limit
      const msgs = await this.client.getMessages(dialog.entity, {
        limit: messageLimit
      });

      const syncedMessages = msgs
        .filter((msg) => msg.message) // Only process messages with text
        .map((msg) => ({
          messageId: msg.id.toString(),
          channelId: channel.channelId,
          chatId,
          messageText: msg.message,
          senderId: msg.senderId?.toString(),
          messageTimestamp: msg.date,
          replyTo: msg.replyTo?.replyToMsgId?.toString(),
          topicId: msg.replyTo?.replyToTopId?.toString(),
          isPinned: msg.pinned
        }));

      if (syncedMessages.length > 0) {
        // Update messages through API
        const response = await fetch('/api/messages/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getJwt()}`
          },
          body: JSON.stringify({ syncedMessages })
        });

        if (!response.ok) {
          throw new Error('Failed to update messages');
        }
      }

      // update local storage group lastSyncedAt
      LocalStorageService.updateGroupLastSyncedAt([chatId]);

      return {
        success: true,
        status: 'success',
        message: 'Messages synced successfully',
        syncedMessages: syncedMessages.length
      };
    } catch (error) {
      console.error('Failed to sync messages:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      await this.disconnect();
    }
  }
}
