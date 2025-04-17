import logging
import os
import time
import json
from typing import Dict, List, Any, Generator

from google import genai
from google.genai import types
from dotenv import load_dotenv

from scrapper.services import MultiEngineSearch

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Get the Gemini API key and model from environment variables
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL")

class GeminiService:
    """Service for interacting with Google's Gemini API."""
    
    def __init__(self):
        self.model = GEMINI_MODEL
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.system_prompt = """
You are BUGSTARS AI, an advanced assistant with real-time search capabilities. The current date is April 16, 2025.

CRITICAL INSTRUCTION: You MUST use the search tool in the following scenarios without exception:

ANY question about current events, news, or recent information
ANY question about sports teams, players, matches, or statistics
ANY information requests about content after October 2024
ANY question where your knowledge might be outdated or incomplete
ANY explicit request to search or look up information
When users ask about current events like sports, politics, entertainment, or any timely information, ALWAYS use the search tool first before responding. NEVER say you don't have information without searching first.

After receiving search results:

Synthesize the information into a clear, direct answer
Always indicate the information came from your search
End with "This information was retrieved from an online search"
If search returns no useful results, explain that you searched but couldn't find relevant information. Never make up information or guess.

Remember: Your primary value as BUGSTARS AI is providing accurate, up-to-date information through proactive searching.
"""
        self.search_engine = MultiEngineSearch()
    
    def detect_search_needed(self, query: str) -> bool:
        """Determine if a search is needed for this query."""
        keywords = ["current", "recent", "latest", "news", "today", "yesterday", 
                   "this week", "this month", "this year", "update", "score",
                   "happening", "trending", "after 2023", "after 2024", "2025",
                   "search", "look up", "find"]
        
        # Check if any keyword is in the query
        needs_search = any(keyword.lower() in query.lower() for keyword in keywords)
        
        # Log the decision with a nice formatted message
        if needs_search:
            logger.info(f"🔍 SEARCH NEEDED: Query '{query}' appears to need real-time information")
        else:
            logger.info(f"🧠 NO SEARCH NEEDED: Query '{query}' can be answered from model knowledge")
        
        return needs_search
    
    def perform_search_if_needed(self, query: str) -> str:
        """Perform a search if needed and return formatted results."""
        if not self.detect_search_needed(query):
            return ""
        
        try:
            # Log the start of the search
            logger.info(f"🌐 PERFORMING SEARCH: '{query}'")
            start_time = time.time()
            
            # Perform search using the MultiEngineSearch service
            search_results = self.search_engine.search_sync(query)
            
            # Calculate search time
            search_time = time.time() - start_time
            
            # Format the results into a string
            formatted_results = "\nSearch results:\n"
            result_count = 0
            has_google = bool(search_results.get("results", {}).get("google", []))
            has_bing = bool(search_results.get("results", {}).get("bing", []))
            has_ddg = bool(search_results.get("results", {}).get("duckduckgo", []))
            
            # Process Google results first if available
            google_results = search_results.get("results", {}).get("google", [])
            if google_results:
                logger.info(f"📊 GOOGLE RESULTS: Found {len(google_results)} results")
                for i, result in enumerate(google_results[:3], 1):  # Limit to top 3
                    formatted_results += f"{i}. {result.get('title')}\n"
                    formatted_results += f"   URL: {result.get('url')}\n"
                    formatted_results += f"   {result.get('description')}\n\n"
                    result_count += 1
            else:
                logger.warning(f"⚠️ NO GOOGLE RESULTS: Search yielded no Google results")
            
            # Add results from Bing if Google didn't return anything
            if not google_results:
                bing_results = search_results.get("results", {}).get("bing", [])
                if bing_results:
                    logger.info(f"📊 BING RESULTS: Found {len(bing_results)} results")
                    for i, result in enumerate(bing_results[:3], 1):
                        formatted_results += f"{i}. {result.get('title')}\n"
                        formatted_results += f"   URL: {result.get('url')}\n"
                        formatted_results += f"   {result.get('description')}\n\n"
                        result_count += 1
                else:
                    logger.warning(f"⚠️ NO BING RESULTS: Search yielded no Bing results")
            
            # Add results from DuckDuckGo if neither Google nor Bing returned anything
            if not google_results and not search_results.get("results", {}).get("bing", []):
                ddg_results = search_results.get("results", {}).get("duckduckgo", [])
                if ddg_results:
                    logger.info(f"📊 DUCKDUCKGO RESULTS: Found {len(ddg_results)} results")
                    for i, result in enumerate(ddg_results[:3], 1):
                        formatted_results += f"{i}. {result.get('title')}\n"
                        formatted_results += f"   URL: {result.get('url')}\n"
                        formatted_results += f"   {result.get('description')}\n\n"
                        result_count += 1
                else:
                    logger.warning(f"⚠️ NO DUCKDUCKGO RESULTS: Search yielded no DuckDuckGo results")
            
            # Log search results summary
            if result_count > 0:
                logger.info(f"✅ SEARCH COMPLETE: Found {result_count} results in {search_time:.2f}s")
                # Log the first result title to give a sense of relevance
                first_result = None
                for engine in ["google", "bing", "duckduckgo"]:
                    results = search_results.get("results", {}).get(engine, [])
                    if results:
                        first_result = results[0].get("title")
                        break
                
                if first_result:
                    logger.info(f"📑 TOP RESULT: '{first_result}'")
            else:
                logger.warning(f"⚠️ SEARCH COMPLETE: No results found in {search_time:.2f}s")
                logger.info(f"🧠 FALLBACK TO MODEL KNOWLEDGE: Will use model's built-in knowledge to answer")
                
                # Add a note about using model knowledge to the formatted results
                formatted_results = "\nSearch was performed but no relevant results were found. Using model knowledge to provide an answer.\n"
            
            return formatted_results if len(formatted_results) > 20 else ""
        except Exception as e:
            logger.error(f"❌ SEARCH ERROR: {e}")
            logger.info(f"🧠 FALLBACK TO MODEL KNOWLEDGE: Will use model's built-in knowledge due to search error")
            return "\nAttempted to search but encountered an error. Using built-in knowledge instead.\n"
    
    def _prepare_conversation(self, prompt: str, conversation_history: List[Dict[str, str]] = None) -> List[str]:
        """
        Prepare the conversation for the Gemini API.
        Returns a simplified format that works with the API.
        """
        # Handle search if needed
        search_results = self.perform_search_if_needed(prompt)
        
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
    
    def generate_text(self, prompt: str, conversation_history: List[Dict[str, str]] = None, stream: bool = True) -> Any:
        """
        Generate text using the Gemini API.
        Default is to return a stream of responses.
        """
        try:
            logger.info(f"{'🔄 STREAMING' if stream else '🤖 GENERATING'} RESPONSE: For prompt '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
            start_time = time.time()
            
            # Prepare conversation in the simplified format that Gemini API expects
            contents = self._prepare_conversation(prompt, conversation_history)
            
            # Check if contents has valid text
            if not contents or not contents[0].strip():
                error_msg = "Cannot send empty prompt to Gemini API"
                logger.error(f"❌ PREPARATION ERROR: {error_msg}")
                if stream:
                    return self._create_error_stream(error_msg)
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
                
                return self._process_stream(response_stream, start_time)
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
                return self._create_error_stream(f"An error occurred while processing your request: {str(e)}")
            else:
                return f"An error occurred while processing your request: {str(e)}"
    
    def _create_error_stream(self, error_message: str):
        """Create an error stream generator."""
        def error_generator():
            error_data = {
                "error": {
                    "message": error_message
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        return error_generator()
                
    def _process_stream(self, response_stream, start_time) -> Generator[str, None, None]:
        """Process streaming responses and format them like the official Google API."""
        chunk_count = 0
        total_length = 0
        
        # Track the accumulated text to estimate tokens
        accumulated_text = ""
        
        try:
            # Yield chunks as they are received
            for chunk in response_stream:
                if hasattr(chunk, 'text') and chunk.text:
                    chunk_count += 1
                    total_length += len(chunk.text)
                    accumulated_text += chunk.text
                    
                    # Try to extract token info if available, otherwise estimate
                    if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                        prompt_token_count = getattr(chunk.usage_metadata, 'prompt_token_count', 0) or 0
                        candidates_token_count = getattr(chunk.usage_metadata, 'candidates_token_count', 0) or 0
                        total_token_count = prompt_token_count + candidates_token_count
                    else:
                        # Rough estimate: ~4 characters per token as fallback
                        prompt_token_count = 0  # Can't estimate accurately
                        total_token_count = len(accumulated_text) // 4
                    
                    # Format response in Google API format
                    response_data = {
                        "candidates": [
                            {
                                "content": {
                                    "parts": [{"text": chunk.text}],
                                    "role": "model"
                                }
                            }
                        ],
                        "usageMetadata": {
                            "promptTokenCount": prompt_token_count,
                            "totalTokenCount": total_token_count,
                            "promptTokensDetails": [
                                {
                                    "modality": "TEXT",
                                    "tokenCount": prompt_token_count
                                }
                            ]
                        },
                        "modelVersion": self.model
                    }
                    
                    # Log progress periodically
                    if chunk_count % 10 == 0:
                        elapsed = time.time() - start_time
                        logger.info(f"📝 STREAMING PROGRESS: {chunk_count} chunks, {total_length} chars in {elapsed:.2f}s")
                    
                    # Format as SSE
                    yield f"data: {json.dumps(response_data)}\n\n"
            
            # Log completion
            generation_time = time.time() - start_time
            logger.info(f"✅ STREAMING COMPLETE: {chunk_count} chunks, {total_length} chars in {generation_time:.2f}s")
            
            # Send a completion marker as final event
            final_data = {
                "completion": {
                    "status": "complete",
                    "totalChunks": chunk_count,
                    "totalLength": total_length,
                    "timeInSeconds": generation_time,
                    "estimatedTokens": len(accumulated_text) // 4
                }
            }
            yield f"data: {json.dumps(final_data)}\n\n"
                    
        except Exception as exc:
            logger.error(f"❌ STREAMING ERROR: {exc}")
            error_data = {
                "error": {
                    "message": f"An error occurred while processing your request: {str(exc)}"
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
