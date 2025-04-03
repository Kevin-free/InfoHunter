import { LocalStorageService } from '@/lib/localStorageService';

export async function updatePublicStatus(chatIds: string[], isPublic: boolean) {
  try {
    // Input validation
    if (!Array.isArray(chatIds) || chatIds.length === 0) {
      console.error('Invalid chatIds:', chatIds);
      return { success: false, error: 'Invalid chat IDs' };
    }

    // Get groups from LocalStorage
    const groups = LocalStorageService.getGroups();
    if (!groups || !Array.isArray(groups)) {
      console.error('Failed to get groups from localStorage:', groups);
      return { success: false, error: 'Failed to get groups' };
    }

    // Track number of updated groups
    let updatedCount = 0;

    // Update public status for selected groups
    chatIds.forEach((chatId) => {
      try {
        const group = groups.find((g) => g.chatId === chatId);
        if (group) {
          LocalStorageService.saveGroup({
            ...group,
            isPublic,
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
        } else {
          console.warn(`Group not found for chatId: ${chatId}`);
        }
      } catch (err) {
        console.error(`Failed to update group ${chatId}:`, err);
      }
    });

    if (updatedCount === 0) {
      return {
        success: false,
        error: 'No groups were updated'
      };
    }

    return {
      success: true,
      message: `Successfully updated ${updatedCount} groups`
    };
  } catch (error) {
    console.error('Detailed error in updatePublicStatus:', {
      error,
      chatIds,
      isPublic
    });
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update public status'
    };
  }
}
