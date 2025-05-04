import { FullChatStore } from '../types';
import { apiService } from '../services/apiService';
import { dbService } from '../services/dbService';
import { SESSION_ID_KEY, safeStorage } from './messageUtils';
import { cleanupEmptyConversations } from './cleanup';

/**
 * Flag for tracking initialization status
 * Prevents redundant initialization attempts
 */
let isInitializing = false;
let isInitialized = false;

/**
 * Initialize the chat store using IndexedDB and API data
 * Uses a parallel loading approach for better performance with data persistence
 *
 * @param getState Function to get the current store state
 * @returns Cleanup function
 */
export function initializeChatStore(getState: () => FullChatStore): () => void {
    // Only initialize once
    if (isInitializing || isInitialized) {
        return () => {};
    }

    isInitializing = true;

    // Mark as not initialized and set loading state in the store
    const store = getState();
    store._setInitialized(false);
    store._setLoadingConversations(true);

    // Start initialization immediately without using queueMicrotask
    initializeConversations(getState);

    return () => {};
}

/**
 * Handle conversation initialization in parallel for better performance
 */
async function initializeConversations(getState: () => FullChatStore): Promise<void> {
    try {
        // First clean up any empty conversations from previous versions
        await cleanupEmptyConversations();

        const store = getState();

        // Try to load session from localStorage as fallback
        let savedSessionId: string | null = null;
        try {
            savedSessionId = safeStorage.getItem<string | null>(SESSION_ID_KEY, null);
        } catch (error) {
            console.error('Failed to read session from localStorage:', error);
        }

        // Start loading conversations from IndexedDB immediately
        // We don't await here - we let it run in parallel with API calls
        const localConversationsPromise = dbService.getAllConversations();

        // Start API call for conversations in parallel - don't wait for IndexedDB
        // This ensures we start the network request as early as possible
        const apiConversationsPromise = apiService.getAllConversations().catch((error) => {
            console.error('Error loading conversations from API:', error);
            return null;
        });

        // Check if saved session exists in IndexedDB
        let sessionExists = false;
        if (savedSessionId) {
            try {
                const conversation = await dbService.getConversation(savedSessionId);
                sessionExists = !!conversation;

                if (sessionExists) {
                    // If found in IndexedDB, immediately set session
                    store._setSessionId(savedSessionId);

                    // Immediately start loading messages from IndexedDB
                    dbService
                        .getMessages(savedSessionId)
                        .then((messages) => {
                            if (messages && messages.length > 0) {
                                const state = getState();
                                state.messages = messages;
                            }
                        })
                        .catch((err) => console.error('Error loading messages from IndexedDB:', err));
                }
            } catch (error) {
                console.error('Error checking session in IndexedDB:', error);
            }
        }

        // Wait for local conversations first - these should load quickly from IndexedDB
        const localConversations = await localConversationsPromise;

        // If we have local conversations, display them immediately
        if (localConversations && localConversations.length > 0) {
            store._setConversations(localConversations);
            // Mark as initialized with local data, but keep loadingConversations true
            // until we've finished API call
            store._setInitialized(true);
        }

        // Then wait for API data - this might take longer
        const apiConversations = await apiConversationsPromise;

        // If API call succeeded, update with server data
        if (apiConversations) {
            store._setConversations(apiConversations);

            // Update IndexedDB with latest from server
            dbService
                .saveConversations(apiConversations)
                .catch((err) => console.error('Failed to sync conversations to IndexedDB:', err));

            // If we had a saved session, verify it exists in API data
            if (savedSessionId) {
                sessionExists = apiConversations.some((conv) => conv.id === savedSessionId);

                if (sessionExists) {
                    store._setSessionId(savedSessionId);
                    // Start loading conversation history as a background task
                    store.refreshConversation().catch((err) => console.error('Error refreshing conversation:', err));
                }
            }
        }

        // Finish loading without creating a new session ID
        // This is the key change - we don't create a new session automatically anymore
        store._setLoadingConversations(false);
        store._setInitialized(true);
        isInitialized = true;
        isInitializing = false;
    } catch (error) {
        console.error('Fatal error during chat initialization:', error);

        // Reset initialization flags
        isInitializing = false;

        const store = getState();

        // Finish loading without creating a session ID even on error
        store._setLoadingConversations(false);
        store._setInitialized(true);
        isInitialized = true;
    }
}
