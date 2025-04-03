import { getJwt } from '@/components/lib/networkUtils';

export interface ChannelMetadataUpdate {
  dataId: string;
  metadata: {
    name: string | null;
    username: string | null;
    about: string | null;
    photo?: string | null;
    participantsCount: number;
    type: string;
  };
}

export async function updateChannelsMetadata(updates: ChannelMetadataUpdate[]) {
  if (!updates || updates.length === 0) {
    return { success: false, error: 'No updates provided' };
  }

  try {
    const response = await fetch('/api/channels/metadata', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getJwt()}`
      },
      body: JSON.stringify({ channelUpdates: updates })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to update channel metadata:', errorData);
      return {
        success: false,
        error: errorData.error || 'Failed to update channel metadata'
      };
    }

    const data = await response.json();
    return {
      success: true,
      results: data.results
    };
  } catch (error) {
    console.error('Error updating channel metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
