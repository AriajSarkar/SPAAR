import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { FullChatStore, initialState } from './types';
import { createStateActions } from './actions/stateActions';
import { createMessageActions } from './actions/messageActions';
import { createConversationActions } from './actions/conversationActions';
import { initializeChatStore as initStore } from './utils/initUtils';

/**
 * Main chat store that combines all modular actions
 * Uses Dexie.js IndexedDB storage for local persistence and faster loading
 *
 * Each action creator is properly typed with StateCreator<FullChatStore, [["zustand/immer", never]], [], ActionSubset>
 * to ensure proper type safety throughout the codebase
 */
export const useChatStore = create<FullChatStore>()(
    immer((set, get, api) => ({
        ...initialState,

        // Combine all action modules with their proper typings for immer middleware
        ...createStateActions(set, get, api),
        ...createMessageActions(set, get, api),
        ...createConversationActions(set, get, api),
    })),
);

/**
 * Initialize the chat store using IndexedDB and API data
 * Uses a hybrid approach for better performance with data persistence
 */
export function initializeChatStore(): () => void {
    return initStore(useChatStore.getState);
}

export default useChatStore;
