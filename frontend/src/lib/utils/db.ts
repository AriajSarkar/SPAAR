import Dexie, { type Table } from 'dexie';
import { ChatMessage, ConversationSummary } from '../store/chat-types';

/**
 * Interface for the data stored in IndexedDB for each conversation
 */
export interface StoredConversation {
    session: ConversationSummary;
    messages: ChatMessage[];
    lastFetched: Date; // Timestamp of the last API fetch for this conversation
}

/**
 * ChatHistoryDB - IndexedDB database for storing full chat conversations
 *
 * Each entry represents a complete conversation (metadata + messages),
 * keyed by the session ID.
 */
export class ChatHistoryDB extends Dexie {
    // Define the single table storing full conversations
    conversations!: Table<StoredConversation, string>; // Key is string (sessionId)

    constructor() {
        // Rename database for clarity
        super('ChatHistoryDatabase');

        // Define the schema for version 1
        // The key is the session ID (implicitly 'id' from the StoredConversation.session object)
        // We index 'session.lastMessageDate' for efficient sorting/querying of summaries
        this.version(1).stores({
            conversations: 'session.id, session.lastMessageDate',
        });

        // Example of a future migration if needed:
        // this.version(2).stores({...}).upgrade(...)
    }

    /**
     * Get summaries of all conversations, sorted by last message date
     */
    async getAllConversationSummaries(): Promise<ConversationSummary[]> {
        try {
            // Fetch all stored conversations, order by lastMessageDate descending
            const allStored = await this.conversations.orderBy('session.lastMessageDate').reverse().toArray();

            // Extract only the session summary part
            return allStored.map((stored) => stored.session);
        } catch (error) {
            console.error('Error fetching conversation summaries from IndexedDB:', error);
            return [];
        }
    }

    /**
     * Get a single full conversation object by ID
     */
    async getFullConversation(sessionId: string): Promise<StoredConversation | undefined> {
        try {
            return await this.conversations.get(sessionId);
        } catch (error) {
            console.error(`Error fetching full conversation ${sessionId} from IndexedDB:`, error);
            return undefined;
        }
    }

    /**
     * Get only the messages for a specific conversation
     */
    async getMessages(sessionId: string): Promise<ChatMessage[]> {
        try {
            const storedConversation = await this.getFullConversation(sessionId);
            return storedConversation?.messages || [];
        } catch (error) {
            console.error(`Error fetching messages for conversation ${sessionId}:`, error);
            return [];
        }
    }

    /**
     * Save or update a full conversation (metadata and messages)
     * Ensures required fields and updates lastFetched timestamp.
     */
    async saveFullConversation(
        sessionId: string,
        session: ConversationSummary,
        messages: ChatMessage[],
    ): Promise<string> {
        try {
            const now = new Date();
            // Ensure required session fields exist
            const validSession: ConversationSummary = {
                id: sessionId,
                title: session.title || 'New conversation',
                createdAt: session.createdAt || now.toISOString(),
                updatedAt: session.updatedAt || now.toISOString(),
                preview:
                    session.preview ||
                    (messages.length > 0 ? messages[messages.length - 1].content.substring(0, 100) : ''),
                messageCount: messages.length, // Calculate count from messages array
                lastMessageDate:
                    session.lastMessageDate ||
                    (messages.length > 0 ? messages[messages.length - 1].timestamp.toISOString() : now.toISOString()),
            };

            const dataToStore: StoredConversation = {
                session: validSession,
                messages: messages, // Store the full messages array
                lastFetched: now, // Update last fetched time
            };

            // Use put which handles both insert and update
            return await this.conversations.put(dataToStore, sessionId);
        } catch (error) {
            console.error(`Error saving full conversation ${sessionId} to IndexedDB:`, error);
            return sessionId; // Return ID even on error
        }
    }

    /**
     * Add a single message to an existing conversation.
     * Fetches the conversation, adds the message, updates metadata, and saves back.
     */
    async addMessage(sessionId: string, message: ChatMessage): Promise<string> {
        try {
            const existing = await this.getFullConversation(sessionId);
            const messages = existing?.messages || [];
            messages.push(message);

            // Update session metadata based on the new message
            const updatedSession: Partial<ConversationSummary> = {
                lastMessageDate: message.timestamp.toISOString(),
                preview: message.content.substring(0, 100),
                messageCount: messages.length,
                updatedAt: new Date().toISOString(),
            };

            const sessionToSave = {
                ...(existing?.session || { id: sessionId }),
                ...updatedSession,
            } as ConversationSummary;

            return await this.saveFullConversation(sessionId, sessionToSave, messages);
        } catch (error) {
            console.error(`Error adding message to conversation ${sessionId}:`, error);
            return message.id; // Or should return sessionId?
        }
    }

    /**
     * Update an existing message within a conversation.
     */
    async updateMessageContent(sessionId: string, messageId: string, newContent: string): Promise<void> {
        try {
            const existing = await this.getFullConversation(sessionId);
            if (!existing) return;

            const messageIndex = existing.messages.findIndex((msg) => msg.id === messageId);
            if (messageIndex === -1) return; // Message not found

            // Update the content
            existing.messages[messageIndex].content = newContent;
            // Optionally update session preview if it was the last message
            if (messageIndex === existing.messages.length - 1) {
                existing.session.preview = newContent.substring(0, 100);
                existing.session.updatedAt = new Date().toISOString();
            }

            await this.saveFullConversation(sessionId, existing.session, existing.messages);
        } catch (error) {
            console.error(`Error updating message $${sessionId}`, error);
        }
    }

    /**
     * Delete a single message from a conversation.
     */
    async deleteMessage(sessionId: string, messageId: string): Promise<void> {
        try {
            const existing = await this.getFullConversation(sessionId);
            if (!existing) return;

            const initialLength = existing.messages.length;
            const updatedMessages = existing.messages.filter((msg) => msg.id !== messageId);

            // Only save if a message was actually deleted
            if (updatedMessages.length < initialLength) {
                // Update metadata
                const lastMsg = updatedMessages.length > 0 ? updatedMessages[updatedMessages.length - 1] : null;
                existing.session.messageCount = updatedMessages.length;
                existing.session.preview = lastMsg ? lastMsg.content.substring(0, 100) : '';
                existing.session.lastMessageDate = lastMsg
                    ? lastMsg.timestamp.toISOString()
                    : existing.session.createdAt;
                existing.session.updatedAt = new Date().toISOString();

                await this.saveFullConversation(sessionId, existing.session, updatedMessages);
            }
        } catch (error) {
            console.error(`Error deleting message ${messageId} from conversation ${sessionId}: `, error);
        }
    }

    /**
     * Delete an entire conversation by ID
     */
    async deleteConversation(sessionId: string): Promise<void> {
        try {
            await this.conversations.delete(sessionId);
        } catch (error) {
            console.error(`Error deleting conversation ${sessionId} from IndexedDB: `, error);
        }
    }

    /**
     * Clear all data from the database
     */
    async clearAll(): Promise<void> {
        try {
            await this.conversations.clear();
        } catch (error) {
            console.error('Error clearing all data from IndexedDB:', error);
        }
    }
}

// Create a single instance of the database
const db = new ChatHistoryDB();

export default db;
