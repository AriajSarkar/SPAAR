import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { generateLLMResponse, getConversationHistory, deleteConversation, getAllConversations, generateSessionId } from '@/lib/api-client';
import { enqueueTask } from '@/lib/utils/task-queue';
import { safeStorage, STORAGE_KEYS } from '@/lib/utils/storage';
import { ChatState, ChatActions, ChatMessage, ConversationSummary } from './chat-types';
import { formatRelativeDate } from '@/lib/utils/date';

type FullChatStore = ChatState & ChatActions;

/**
 * Generate a unique ID for messages
 */
function generateMessageId(): string {
  return generateSessionId();
}

/**
 * Initial state for the chat store
 */
const initialState: ChatState = {
  // Chat message state
  messages: [],
  isLoading: false,
  isStreaming: false,
  currentStreamContent: '',
  abortController: null,
  
  // Session management
  sessionId: null,
  conversations: [],
  loadingConversations: false,
  deletingConversations: {},
  
  // Error states
  error: null,
  retryCount: 0,
  
  // Status tracking
  pendingTasks: {},
  initialized: false,
};

/**
 * Main chat store with both state and actions
 */
export const useChatStore = create<FullChatStore>()(
  immer((set, get) => ({
    ...initialState,
    
    // Actions that modify state
    _addMessage: (message) => set(state => {
      state.messages.push(message);
    }),
    
    _updateLastBotMessage: (content) => set(state => {
      const lastIndex = state.messages.length - 1;
      if (lastIndex >= 0) {
        state.messages[lastIndex].content = content;
      }
    }),
    
    _setLoading: (isLoading) => set(state => {
      state.isLoading = isLoading;
    }),
    
    _setStreaming: (isStreaming) => set(state => {
      state.isStreaming = isStreaming;
    }),
    
    _setStreamContent: (content) => set(state => {
      state.currentStreamContent = content;
      
      // Also update the message in the messages array
      const lastIndex = state.messages.length - 1;
      if (lastIndex >= 0 && state.messages[lastIndex].sender === 'bot') {
        state.messages[lastIndex].content = content;
      }
    }),
    
    _setAbortController: (controller) => set(state => {
      state.abortController = controller;
    }),
    
    _setSessionId: (sessionId) => set(state => {
      state.sessionId = sessionId;
      
      // Store in localStorage if not null
      if (sessionId) {
        safeStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
      } else {
        safeStorage.removeItem(STORAGE_KEYS.SESSION_ID);
      }
    }),
    
    _setConversations: (conversations) => set(state => {
      state.conversations = conversations;
    }),
    
    _setLoadingConversations: (loading) => set(state => {
      state.loadingConversations = loading;
    }),
    
    _setDeletingConversation: (sessionId, isDeleting) => set(state => {
      if (isDeleting) {
        state.deletingConversations[sessionId] = true;
      } else {
        delete state.deletingConversations[sessionId];
      }
    }),
    
    _setError: (error) => set(state => {
      state.error = error;
    }),
    
    _setPendingTask: (taskId, isPending) => set(state => {
      if (isPending) {
        state.pendingTasks[taskId] = true;
      } else {
        delete state.pendingTasks[taskId];
      }
    }),
    
    _setInitialized: (initialized) => set(state => {
      state.initialized = initialized;
    }),
    
    /**
     * Add or update a conversation in the local state
     * @param sessionId The session ID of the conversation
     * @param title An optional title for the conversation
     */
    _addOrUpdateConversation: (sessionId: string, title = 'New conversation') => set(state => {
      // Check if conversation already exists
      const existingIndex = state.conversations.findIndex(conv => conv.id === sessionId);
      const now = new Date().toISOString();
      
      if (existingIndex >= 0) {
        // Update existing conversation
        state.conversations[existingIndex] = {
          ...state.conversations[existingIndex],
          title: title || state.conversations[existingIndex].title,
          updatedAt: now
        };
      } else {
        // Add new conversation
        state.conversations.unshift({
          id: sessionId,
          title,
          createdAt: now,
          updatedAt: now
        });
      }
      
      // Sort by updatedAt (newest first)
      state.conversations.sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    }),
    
    // Load all conversations with optimized background loading
    // No UI indicators will be shown for this operation
    loadAllConversations: async () => {
      const taskId = 'load-all-conversations';
      const state = get();
      
      // Skip if another load is already in progress to prevent duplicate requests
      if (state.pendingTasks[taskId]) {
        return;
      }
      
      // Track the task but don't update visible loading state
      set(state => {
        state.pendingTasks[taskId] = true;
        // Don't set loadingConversations to true to avoid UI indicators
      });
      
      try {
        await new Promise<void>((resolve, reject) => {
          enqueueTask(
            taskId,
            async () => {
              try {
                const allConversations = await getAllConversations();
                
                // Transform responses to match our local type structure
                const formattedConversations: ConversationSummary[] = allConversations.map(
                  (conv: any) => ({
                    id: conv.id,
                    title: conv.title || 'Untitled conversation',
                    createdAt: conv.created_at || new Date().toISOString(),
                    updatedAt: conv.updated_at || new Date().toISOString()
                  })
                );
                
                set(state => {
                  state.conversations = formattedConversations;
                  delete state.pendingTasks[taskId];
                });
                resolve();
              } catch (error) {
                console.error('Error loading conversations:', error);
                reject(error);
              }
            },
            {
              priority: 2,
              onError: (error) => {
                set(state => {
                  delete state.pendingTasks[taskId];
                  // Don't set error in UI since loading happens silently
                  console.error('Failed to load conversations:', error);
                });
              }
            }
          );
        });
      } catch (error) {
        // Error already handled in task
      }
    },
    
    // Load a specific conversation
    refreshConversation: async () => {
      const state = get();
      const { sessionId } = state;
      
      if (!sessionId) return;
      
      const taskId = `refresh-conversation-${sessionId}`;
      
      // Don't start another load if one is already in progress
      if (state.isLoading || state.pendingTasks[taskId]) {
        return;
      }
      
      set(state => {
        state.isLoading = true;
        state.pendingTasks[taskId] = true;
        state.error = null;
      });
      
      try {
        await new Promise<void>((resolve, reject) => {
          enqueueTask(
            taskId,
            async () => {
              try {
                const history = await getConversationHistory(sessionId);
                
                if (history && history.history && Array.isArray(history.history)) {
                  const formattedMessages = history.history.map((msg: any) => ({
                    id: generateMessageId(),
                    content: msg.content || '',
                    sender: msg.role === 'user' ? 'user' : 'bot',
                    timestamp: new Date(msg.created_at || Date.now()),
                    error: false,
                  }));
                  
                  set(state => {
                    state.messages = formattedMessages;
                    state.isLoading = false;
                    delete state.pendingTasks[taskId];
                    
                    // Also update this conversation's data in the list
                    if (history.title) {
                      get()._addOrUpdateConversation(sessionId, history.title);
                    }
                  });
                }
                
                resolve();
              } catch (error) {
                console.error('Error loading conversation:', error);
                reject(error);
              }
            },
            {
              onError: (error) => {
                set(state => {
                  state.isLoading = false;
                  delete state.pendingTasks[taskId];
                  state.error = error.message;
                  
                  // If we can't load this conversation, create a new one
                  if (state.conversations.length === 0) {
                    const newSessionId = generateSessionId();
                    state.sessionId = newSessionId;
                    state.messages = [];
                    safeStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
                    
                    // Add optimistic entry for the new conversation
                    get()._addOrUpdateConversation(newSessionId);
                  }
                });
              }
            }
          );
        });
      } catch (error) {
        // Error already handled in task
      }
    },
    
    // Send a message to the LLM API
    sendMessage: async (message) => {
      const state = get();
      
      if (!message.trim() || state.isLoading) {
        return;
      }
      
      // Ensure we have a session ID
      const currentSessionId = state.sessionId || generateSessionId();
      if (!state.sessionId) {
        get()._setSessionId(currentSessionId);
        
        // Add optimistic entry for the new conversation
        get()._addOrUpdateConversation(currentSessionId);
      }
      
      // Add user message immediately for better UX
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        content: message,
        sender: 'user',
        timestamp: new Date(),
      };
      
      get()._addMessage(userMessage);
      get()._setLoading(true);
      get()._setError(null);
      
      // Update conversation with first message as title
      // Only for new conversations with no messages yet
      if (state.messages.length === 0) {
        // Truncate message if too long for the title
        const truncatedTitle = message.length > 40 
          ? `${message.substring(0, 37)}...` 
          : message;
        
        get()._addOrUpdateConversation(currentSessionId, truncatedTitle);
      } else {
        // For existing conversations, just update the timestamp
        get()._addOrUpdateConversation(currentSessionId);
      }
      
      try {
        const abortController = new AbortController();
        get()._setAbortController(abortController);
        
        // Start streaming
        get()._setStreaming(true);
        get()._setStreamContent('');
        
        // Add placeholder for bot response
        const responsePlaceholder: ChatMessage = {
          id: generateMessageId(),
          content: '',
          sender: 'bot',
          timestamp: new Date(),
        };
        
        get()._addMessage(responsePlaceholder);
        
        // Stream handler function
        const handleStreamChunk = (chunk: string) => {
          if (get().abortController === abortController) {
            get()._setStreamContent(get().currentStreamContent + chunk);
          }
        };
        
        // Make the API request in a non-blocking way
        await new Promise<void>((resolve, reject) => {
          // Use a separate microtask to avoid blocking
          queueMicrotask(async () => {
            try {
              const response = await generateLLMResponse(
                message, 
                currentSessionId,
                true,
                handleStreamChunk
              );
              
              // Handle session ID from response
              if (response && response.session_id) {
                const responseSessionId = response.session_id;
                get()._setSessionId(responseSessionId);
                
                // If backend gave us a different session ID, update our optimistic entry
                if (responseSessionId !== currentSessionId) {
                  // Update the conversation with the new session ID
                  get()._addOrUpdateConversation(responseSessionId, response.title || message.substring(0, 40));
                  
                  // Remove the optimistic entry if it's different
                  set(state => {
                    state.conversations = state.conversations.filter(
                      conv => conv.id !== currentSessionId || conv.id === responseSessionId
                    );
                  });
                }
              }
              
              // Update message content with final response
              if (response && (response.response || typeof response.response === 'string')) {
                const finalContent = response.response || '';
                get()._updateLastBotMessage(finalContent);
                get()._setStreamContent(finalContent);
              }
              
              resolve();
            } catch (error) {
              console.error('Error sending message:', error);
              
              // Update last message as error
              const lastIndex = get().messages.length - 1;
              if (lastIndex >= 0) {
                set(state => {
                  state.messages[lastIndex] = {
                    ...state.messages[lastIndex],
                    content: error instanceof Error 
                      ? error.message 
                      : 'An error occurred while processing your request.',
                    error: true,
                    isRetryable: true,
                  };
                  
                  state.error = error instanceof Error ? error.message : 'Unknown error';
                });
              }
              
              reject(error);
            } finally {
              get()._setLoading(false);
              get()._setStreaming(false);
              get()._setAbortController(null);
            }
          });
        });
      } catch (error) {
        // Already handled in the promise
      }
    },
    
    // Retry sending a failed message
    handleRetry: (index) => {
      const state = get();
      const { messages } = state;
      
      if (index < 0 || index >= messages.length) return;
      
      const messageToRetry = messages[index];
      if (messageToRetry.sender !== 'user') return;
      
      set(state => {
        state.messages = state.messages.slice(0, index + 1);
        state.retryCount = state.retryCount + 1;
      });
      
      get().sendMessage(messageToRetry.content);
    },
    
    // Cancel an in-progress response
    cancelResponse: () => {
      const state = get();
      
      if (state.abortController) {
        state.abortController.abort();
        get()._setAbortController(null);
      }
      
      get()._setLoading(false);
      get()._setStreaming(false);
      
      // Remove the last message if it's a bot message being generated
      const lastIndex = state.messages.length - 1;
      if (lastIndex >= 0 && 
          state.messages[lastIndex].sender === 'bot' && 
          state.messages[lastIndex].content === '') {
        set(state => {
          state.messages = state.messages.slice(0, -1);
        });
      }
    },
    
    // Switch to a different conversation
    switchConversation: async (sid: string) => {
      const state = get();
      
      if (state.isLoading || sid === state.sessionId) return;
      
      get()._setError(null);
      get()._setSessionId(sid);
      
      // Clear current messages while loading
      set(state => {
        state.messages = [];
      });
      
      await get().refreshConversation();
    },
    
    // Delete a conversation - improved to handle local-only conversations
    deleteConversationById: async (sid: string) => {
      const state = get();
      
      if (state.isLoading || state.deletingConversations[sid]) return;
      
      get()._setDeletingConversation(sid, true);
      get()._setError(null);
      
      // Determine if this is a local-only conversation (has no messages or never synced)
      const isLocalOnly = state.conversations.some(c => 
        c.id === sid && (!c.createdAt || c.createdAt.startsWith('local_'))
      );
      
      // Optimistically remove from UI immediately
      set(state => {
        state.conversations = state.conversations.filter(conv => conv.id !== sid);
      });
      
      // Handle local-only deletion without API call
      if (isLocalOnly) {
        // If we deleted the current conversation, create a new one
        if (sid === get().sessionId) {
          // Clear current session ID and messages
          get()._setSessionId(null);
          set(state => {
            state.messages = [];
            delete state.deletingConversations[sid];
          });
          
          // Create a new chat
          await get().newChat();
        } else {
          set(state => {
            delete state.deletingConversations[sid];
          });
        }
        return;
      }
      
      // For server-synced conversations, call API
      try {
        await new Promise<void>((resolve, reject) => {
          enqueueTask(
            `delete-conversation-${sid}`,
            async () => {
              try {
                await deleteConversation(sid);
                
                // Keep the optimistically updated state
                set(state => {
                  delete state.deletingConversations[sid];
                });
                
                // If we deleted the current conversation, create a new one
                if (sid === get().sessionId) {
                  // Clear current session ID and messages
                  get()._setSessionId(null);
                  set(state => {
                    state.messages = [];
                  });
                  
                  // Create a new chat
                  await get().newChat();
                }
                
                resolve();
              } catch (error) {
                console.error('Error deleting conversation:', error);
                
                // Restore the conversation in case of error
                set(state => {
                  const conversationToRestore = state.conversations.find(c => c.id === sid);
                  if (!conversationToRestore) {
                    // Try to fetch it from API again
                    get().loadAllConversations();
                  }
                });
                
                reject(error);
              }
            },
            {
              priority: 1,
              onError: (error) => {
                get()._setDeletingConversation(sid, false);
                get()._setError(`Failed to delete: ${error.message}`);
                
                // If this was the current conversation, ensure we still have a valid state
                if (sid === get().sessionId && get().conversations.length === 0) {
                  // Create a new chat
                  get().newChat();
                }
              }
            }
          );
        });
      } catch (error) {
        // Error already handled in task
      }
    },
    
    // Create a new conversation
    newChat: async () => {
      const state = get();
      
      if (state.isLoading) return;
      
      get()._setError(null);
      
      const newSessionId = generateSessionId();
      get()._setSessionId(newSessionId);
      
      set(state => {
        state.messages = [];
      });
      
      // Add optimistic entry for the new conversation immediately
      get()._addOrUpdateConversation(newSessionId, 'New conversation');
    }
  }))
);

/**
 * Flag for tracking initialization status without using the store
 * Prevents redundant initialization attempts
 */
let isInitializing = false;
let isInitialized = false;

/**
 * Initialize the chat store by loading the saved session ID and conversations
 * Uses an optimized approach to prevent blocking the main thread
 */
export function initializeChatStore(): () => void {
  // Only initialize once
  if (isInitializing || isInitialized) {
    return () => {};
  }

  isInitializing = true;
  
  // Mark as not initialized in the store
  useChatStore.getState()._setInitialized(false);

  // Use a microtask to avoid blocking the main thread during initialization
  queueMicrotask(() => {
    try {
      const store = useChatStore.getState();
      
      // Get session ID - use safe storage utility with default value
      const savedSessionId = safeStorage.getItem<string | null>(STORAGE_KEYS.SESSION_ID, null);
      
      // First load all conversations to check if the saved session ID exists
      store.loadAllConversations().then(() => {
        if (savedSessionId) {
          store._setSessionId(savedSessionId);
          
          // Check if this saved session actually exists in the loaded conversations
          const currentState = useChatStore.getState();
          const sessionExists = currentState.conversations.some(
            (conv: ConversationSummary) => conv.id === savedSessionId
          );
          
          if (sessionExists) {
            // Only create optimistic entry and load history if session exists
            store._addOrUpdateConversation(savedSessionId);
            
            // Load conversation history in the background without blocking UI
            enqueueTask(
              'init-refresh-conversation',
              async () => {
                await store.refreshConversation();
              },
              {
                onError: () => {
                  // If loading fails, create a new session
                  const newSessionId = generateSessionId();
                  store._setSessionId(newSessionId);
                  // Add optimistic entry
                  store._addOrUpdateConversation(newSessionId);
                }
              }
            );
          } else {
            // Session ID not found in conversations - create a new one
            const newSessionId = generateSessionId();
            store._setSessionId(newSessionId);
            store._addOrUpdateConversation(newSessionId);
          }
        } else {
          // If no session ID exists, create a new one
          const newSessionId = generateSessionId();
          store._setSessionId(newSessionId);
          // Add optimistic entry
          store._addOrUpdateConversation(newSessionId);
        }
        
        // Mark as initialized
        store._setInitialized(true);
        isInitialized = true;
        isInitializing = false;
      }).catch(() => {
        // If conversation loading fails, still create a session
        const newSessionId = generateSessionId();
        store._setSessionId(newSessionId);
        // Add optimistic entry
        store._addOrUpdateConversation(newSessionId);
        
        // Mark as initialized even on error
        store._setInitialized(true);
        isInitialized = true;
        isInitializing = false;
      });
      
    } catch (error) {
      // Reset initialization flags on error
      isInitializing = false;
      console.error('Fatal error during chat initialization:', error);
    }
  });
  
  return () => {};
}