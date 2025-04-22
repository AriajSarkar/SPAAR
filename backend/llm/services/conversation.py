"""
Conversation handling for LLM interactions.
"""
from typing import List, Dict

from .config import logger, SYSTEM_PROMPT
from .search import SearchUtils

class ConversationHandler:
    """Handles conversation preparation for LLM interactions."""
    
    def __init__(self):
        self.system_prompt = SYSTEM_PROMPT
        self.search_utils = SearchUtils()
    
    def prepare_conversation(self, prompt: str, conversation_history: List[Dict[str, str]] = None) -> List[str]:
        """
        Prepare the conversation for the Gemini API.
        Returns a simplified format that works with the API.
        """
        # Handle search if needed
        search_results = self.search_utils.perform_search_if_needed(prompt)
        
        # Build conversation context
        conversation_text = ""
        
        # Add system prompt first
        conversation_text += f"{self.system_prompt}\n\n"
        
        # Add conversation history if present
        if conversation_history:
            for msg in conversation_history:
                role = msg["role"]
                content = msg["content"]
                # Format based on role
                if role == "user":
                    conversation_text += f"User: {content}\n\n"
                elif role == "assistant":
                    conversation_text += f"Assistant: {content}\n\n"
        
        # Add search results if available
        if search_results:
            conversation_text += f"\n{search_results}\n"
            logger.info(f"📊 SEARCH RESULTS: Added to conversation context")
            
        # Add current prompt
        conversation_text += f"User: {prompt}\n\nAssistant: "
        
        logger.info(f"📝 PREPARED CONVERSATION: {len(conversation_text)} chars")
        
        # Return as a simple string in a list, which is what the API expects
        return [conversation_text]
