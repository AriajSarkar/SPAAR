"""
Google Gemini API integration service.
"""
import time
from typing import Dict, List, Any

from google import genai

from .config import logger, GEMINI_API_KEY, GEMINI_MODEL
from .conversation import ConversationHandler
from .stream import StreamProcessor

class GeminiService:
    """Service for interacting with Google's Gemini API."""
    
    def __init__(self):
        self.model = GEMINI_MODEL
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.conversation_handler = ConversationHandler()
        self.stream_processor = StreamProcessor()
    
    def generate_text(self, prompt: str, conversation_history: List[Dict[str, str]] = None, stream: bool = True) -> Any:
        """
        Generate text using the Gemini API.
        Default is to return a stream of responses.
        """
        try:
            logger.info(f"{'🔄 STREAMING' if stream else '🤖 GENERATING'} RESPONSE: For prompt '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
            start_time = time.time()
            
            # Prepare conversation in the simplified format that Gemini API expects
            contents = self.conversation_handler.prepare_conversation(prompt, conversation_history)
            
            # Check if contents has valid text
            if not contents or not contents[0].strip():
                error_msg = "Cannot send empty prompt to Gemini API"
                logger.error(f"❌ PREPARATION ERROR: {error_msg}")
                if stream:
                    return self.stream_processor.create_error_stream(error_msg)
                else:
                    return f"An error occurred: {error_msg}"
                    
            # Log the model being used
            logger.info(f"🤖 USING MODEL: {self.model}")
            
            if stream:
                # Use the simplified API call format for streaming with minimal parameters
                response_stream = self.client.models.generate_content_stream(
                    model=self.model,
                    contents=contents
                )
                
                return self.stream_processor.process_stream(response_stream, start_time, self.model)
            else:
                # Generate complete response using the simplified API call format
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents
                )
                
                generation_time = time.time() - start_time
                logger.info(f"✨ RESPONSE GENERATED: In {generation_time:.2f}s")
                
                return response.text
                
        except Exception as e:
            error_msg = f"{'❌ STREAMING ERROR' if stream else '❌ GENERATION ERROR'}: {e}"
            logger.error(error_msg)
            if stream:
                return self.stream_processor.create_error_stream(f"An error occurred while processing your request: {str(e)}")
            else:
                return f"An error occurred while processing your request: {str(e)}"
