// 'use client';

// import { useEffect, useMemo, useCallback, useState } from 'react';
// import { useBackgroundSync } from '@/lib/utils/background-sync';
// import { useChatStore } from '@/lib/store/chat-store';
// import { SyncStatusInfo } from '@/lib/utils/background-sync';
// import type { ConversationSummary } from '@/lib/store/chat-types';

// /**
//  * Hook that connects the background sync service with the chat store
//  * This eliminates the need for useState-based loading indicators in components
//  * and handles conversation deduplication
//  */
// export function useChatSync() {
//   const {
//     sessionId,
//     conversations,
//     messages,
//     sendMessage: storeSendMessage,
//     deleteConversationById,
//     _addOrUpdateConversation,
//     _setSyncStatus,
//     _setConversations,
//     initialized,
//   } = useChatStore();
  
//   // Track recently deleted conversation IDs to prevent sidebar flashing
//   const [recentlyDeletedIds, setRecentlyDeletedIds] = useState<Set<string>>(new Set());
  
//   const { syncStatus, isPending, enqueue } = useBackgroundSync();
  
//   // Filter out any new/empty conversations from display until they have content
//   const filteredConversations = useMemo(() => {
//     return conversations.filter(conv => {
//       // Skip recently deleted conversations
//       if (recentlyDeletedIds.has(conv.id)) return false;
      
//       // Skip new conversations that haven't been interacted with
//       const isNewEmptyConversation = 
//         conv.title === 'New conversation' && 
//         !messages.length && 
//         conv.id === sessionId;
        
//       return !isNewEmptyConversation;
//     });
//   }, [conversations, recentlyDeletedIds, messages.length, sessionId]);
  
//   // Expose sync status to component
//   const syncingConversations = useMemo(() => {
//     return Object.keys(syncStatus).filter(id => 
//       syncStatus[id].status === 'pending'
//     );
//   }, [syncStatus]);
  
//   // Map conversation IDs to their sync status
//   const conversationSyncStatus = useMemo(() => {
//     const result: Record<string, SyncStatusInfo> = {};
//     filteredConversations.forEach(conv => {
//       if (syncStatus[conv.id]) {
//         result[conv.id] = syncStatus[conv.id];
//       }
//     });
//     return result;
//   }, [filteredConversations, syncStatus]);

//   /**
//    * Enhanced sendMessage function that stays strictly local until explicitly synced
//    * No automatic API calls - strictly local-first approach
//    */
//   const sendMessage = useCallback(async (message: string) => {
//     // Use the store's sendMessage for immediate UI update without API calls
//     await storeSendMessage(message);
    
//     // Do not enqueue any background sync - local only mode
//   }, [storeSendMessage]);
  
//   /**
//    * Manual sync function that can be called explicitly when user wants to sync
//    * This is not called automatically - provides control over when API calls are made
//    */
//   const syncCurrentConversation = useCallback(() => {
//     if (!sessionId || messages.length === 0) return;
    
//     const conversation = conversations.find(c => c.id === sessionId);
//     if (!conversation) return;
    
//     // Determine operation type based on conversation state
//     const isNewConversation = conversation.title === 'New conversation';
//     const operationType = isNewConversation ? 'create' : 'update';
    
//     // Explicitly enqueue sync operation
//     enqueue(operationType, {
//       sessionId,
//       messages,
//       title: conversation.title
//     });
//   }, [sessionId, conversations, messages, enqueue]);
  
//   /**
//    * Enhanced deleteConversation function with strictly local operation
//    * Only performs optimistic UI updates without API calls
//    * Ensures proper removal from sidebar history
//    */
//   const deleteConversation = useCallback(async (sid: string) => {
//     // Skip if conversation is already being deleted
//     if (useChatStore.getState().deletingConversations[sid]) {
//       return;
//     }
    
//     // Add to recently deleted set to prevent flickering in the UI
//     setRecentlyDeletedIds(prev => {
//       const updated = new Set(prev);
//       updated.add(sid);
//       return updated;
//     });
    
//     // Perform optimistic update via store - local only
//     await deleteConversationById(sid);
    
//     // Remove any duplicate entries that might appear in sidebar
//     // This ensures complete cleanup of the conversation from UI
//     const remainingConversations = useChatStore.getState().conversations.filter(
//       conv => conv.id !== sid
//     );
    
//     _setConversations(remainingConversations);
    
//     // Remove from recently deleted after a delay
//     setTimeout(() => {
//       setRecentlyDeletedIds(prev => {
//         const updated = new Set(prev);
//         updated.delete(sid);
//         return updated;
//       });
//     }, 1000); // Remove from tracking after 1 second
    
//     // Do not enqueue any background sync operations - local only
//   }, [deleteConversationById, _setConversations]);
  
//   /**
//    * Explicit function to delete on backend - only called when explicitly needed
//    */
//   const syncDeleteConversation = useCallback((sid: string) => {
//     // Only sync with backend when explicitly requested
//     enqueue('delete', { sessionId: sid });
//   }, [enqueue]);
  
//   // Sync the background service status with the store
//   useEffect(() => {
//     // Update store's sync status to match background service
//     Object.entries(syncStatus).forEach(([sid, status]) => {
//       _setSyncStatus(sid, status);
//     });
//   }, [syncStatus, _setSyncStatus]);
  
//   // Return the enhanced API
//   return {
//     // Original store values
//     sessionId,
//     conversations: filteredConversations, // Return filtered conversations instead
//     messages,
//     initialized,
    
//     // Enhanced functions - strictly local-first
//     sendMessage,
//     deleteConversation,
    
//     // Explicit sync functions - only called when explicitly needed
//     syncCurrentConversation,
//     syncDeleteConversation,
    
//     // Sync status
//     syncStatus: conversationSyncStatus,
//     isSyncing: syncingConversations.length > 0,
//     isPendingSync: (sid: string) => isPending(sid),
//   };
// }