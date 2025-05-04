import db from '@/lib/utils/db';
import type { ChatMessage, ConversationSummary } from '../types';

/**
 * Database service for chat operations
 * Provides a cleaner interface to the Dexie.js database operations
 */
export const dbService = {
    /**
     * Get all conversations from the database
     */
    async getAllConversations(): Promise<ConversationSummary[]> {
        try {
            return await db.getAllConversationSummaries();
        } catch (error) {
            console.error('Error fetching conversations from IndexedDB:', error);
            return [];
        }
    },

    /**
     * Get a conversation by ID
     */
    async getConversation(id: string): Promise<ConversationSummary | null> {
        try {
            const conversation = await db.getFullConversation(id);
            return conversation?.session || null;
        } catch (error) {
            console.error(`Error fetching conversation ${id} from IndexedDB:`, error);
            return null;
        }
    },

    /**
     * Save a conversation to the database
     */
    async saveConversation(conversation: ConversationSummary): Promise<string> {
        try {
            return await db.saveFullConversation(conversation.id, conversation, []);
        } catch (error) {
            console.error('Error saving conversation to IndexedDB:', error);
            return conversation.id;
        }
    },

    /**
     * Save multiple conversations to the database
     */
    async saveConversations(conversations: ConversationSummary[]): Promise<void> {
        try {
            await Promise.all(conversations.map((conv) => db.saveFullConversation(conv.id, conv, [])));
        } catch (error) {
            console.error('Error saving conversations to IndexedDB:', error);
        }
    },

    /**
     * Delete a conversation and its messages
     */
    async deleteConversation(id: string): Promise<void> {
        try {
            await db.deleteConversation(id);
        } catch (error) {
            console.error(`Error deleting conversation ${id} from IndexedDB:`, error);
        }
    },

    /**
     * Get all messages for a conversation
     */
    async getMessages(sessionId: string): Promise<ChatMessage[]> {
        try {
            return await db.getMessages(sessionId);
        } catch (error) {
            console.error(`Error fetching messages for conversation ${sessionId}:`, error);
            return [];
        }
    },

    /**
     * Save a message to a conversation
     */
    async saveMessage(sessionId: string, message: ChatMessage): Promise<string> {
        try {
            // First check if this session exists as a valid conversation
            const conversation = await db.getFullConversation(sessionId);

            // Only save message if it belongs to a valid conversation with messages
            // or if this is a session with confirmed API data
            if (
                conversation &&
                (conversation.messages.length > 0 ||
                    (conversation.session.messageCount !== undefined && conversation.session.messageCount > 0))
            ) {
                return await db.addMessage(sessionId, message);
            }

            // Otherwise, just return the message ID without saving
            return message.id;
        } catch (error) {
            console.error(`Error saving message to conversation ${sessionId}:`, error);
            return message.id;
        }
    },

    /**
     * Update an existing message
     */
    async updateMessage(sessionId: string, messageId: string, content: string): Promise<void> {
        try {
            await db.updateMessageContent(sessionId, messageId, content);
        } catch (error) {
            console.error(`Error updating message ${messageId} in conversation ${sessionId}:`, error);
        }
    },

    /**
     * Delete a specific message from a conversation
     */
    async deleteMessage(sessionId: string, messageId: string): Promise<void> {
        try {
            await db.deleteMessage(sessionId, messageId);
        } catch (error) {
            console.error(`Error deleting message ${messageId} from conversation ${sessionId}:`, error);
        }
    },
};
