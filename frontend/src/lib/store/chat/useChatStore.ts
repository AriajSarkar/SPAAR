import { create } from 'zustand';
import { dbService } from './services/dbService';
import apiSyncService from './services/apiSyncService';
import type { ChatMessage, ConversationSummary } from './types';

interface ChatState {
    conversations: ConversationSummary[];
    currentConversation: ConversationSummary | null;
    messages: ChatMessage[];
    loading: boolean;

    // Actions
    loadConversations: () => Promise<void>;
    loadConversation: (id: string) => Promise<void>;
    createConversation: (title: string) => Promise<ConversationSummary>;
    deleteConversation: (id: string) => Promise<void>;
    sendMessage: (content: string) => Promise<void>;
    updateMessage: (messageId: string, content: string) => Promise<void>;
    clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    loading: false,

    loadConversations: async () => {
        set({ loading: true });
        const conversations = await dbService.getAllConversations();
        set({ conversations, loading: false });
    },

    loadConversation: async (id: string) => {
        set({ loading: true });
        const conversation = await dbService.getConversation(id);
        if (conversation) {
            const messages = await dbService.getMessages(id);
            set({ currentConversation: conversation, messages, loading: false });

            // Queue sync with server if needed
            apiSyncService.queueConversationSync(conversation);
        } else {
            set({ loading: false });
        }
    },

    createConversation: async (title: string) => {
        const now = new Date().toISOString();
        const newConversation: ConversationSummary = {
            id: crypto.randomUUID(),
            title,
            createdAt: now,
            updatedAt: now,
            lastMessageDate: now,
            messageCount: 0,
        };

        await dbService.saveConversation(newConversation);

        set((state) => ({
            conversations: [newConversation, ...state.conversations],
            currentConversation: newConversation,
            messages: [],
        }));

        // Queue sync with server
        apiSyncService.queueConversationSync(newConversation);

        return newConversation;
    },

    deleteConversation: async (id: string) => {
        await dbService.deleteConversation(id);

        const { currentConversation } = get();
        set((state) => ({
            conversations: state.conversations.filter((c) => c.id !== id),
            currentConversation: currentConversation?.id === id ? null : currentConversation,
            messages: currentConversation?.id === id ? [] : state.messages,
        }));
    },

    sendMessage: async (content: string) => {
        const { currentConversation } = get();
        if (!currentConversation) return;

        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender: 'user',
            content,
            timestamp: new Date(),
        };

        // Save message locally
        await dbService.saveMessage(currentConversation.id, newMessage);

        // Update state
        set((state) => ({
            messages: [...state.messages, newMessage],
        }));

        // Queue sync with server
        apiSyncService.queueMessageSync(newMessage);
    },

    updateMessage: async (messageId: string, content: string) => {
        const { currentConversation } = get();
        if (!currentConversation) return;

        await dbService.updateMessage(currentConversation.id, messageId, content);

        set((state) => ({
            messages: state.messages.map((msg) => (msg.id === messageId ? { ...msg, content } : msg)),
        }));
    },

    clearMessages: () => {
        set({ messages: [] });
    },
}));
