/**
 * Chat Store - Main entry point
 *
 * This file re-exports the modular chat store implementation.
 * Components should import from this file rather than directly
 * from the internal modules for better encapsulation.
 */

// Import and re-export from the modular implementation
export {
    useChatStore,
    initializeChatStore,
    // Types that consumers might need
    type ChatMessage,
    type ConversationSummary,
    type MessageSender,
} from './chat/index';

// Export a default for ease of use
import { useChatStore as defaultExport } from './chat/index';
export default defaultExport;
