import { dbService } from '../services/dbService';
import { ConversationSummary } from '../types';

/**
 * Clean up any empty conversations in IndexedDB
 * This is a utility function to fix issues with previous versions
 * that may have stored empty conversations
 */
export async function cleanupEmptyConversations(): Promise<void> {
    try {
        // Get all conversations from IndexedDB
        const conversations = await dbService.getAllConversations();

        // Find any empty conversations (no messages or default preview)
        const emptyConversations = conversations.filter(
            (conv: ConversationSummary) => conv.messageCount === 0 || conv.preview === 'No messages yet',
        );

        // Delete each empty conversation
        if (emptyConversations.length > 0) {
            console.log(`Cleaning up ${emptyConversations.length} empty conversations`);

            await Promise.all(
                emptyConversations.map((conv: ConversationSummary) => dbService.deleteConversation(conv.id)),
            );
        }
    } catch (error) {
        console.error('Error cleaning up empty conversations:', error);
    }
}
