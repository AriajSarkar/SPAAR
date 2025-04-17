"""
Stream processing utilities for handling LLM responses.
"""
import json
import time
from typing import Generator, Any

from .config import logger

class StreamProcessor:
    """Handle streaming responses from LLM APIs."""
    
    @staticmethod
    def create_error_stream(error_message: str):
        """Create an error stream generator."""
        def error_generator():
            error_data = {
                "error": {
                    "message": error_message
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
        return error_generator()
                
    @staticmethod
    def process_stream(response_stream, start_time: float, model_name: str) -> Generator[str, None, None]:
        """Process streaming responses and format them like the official Google API."""
        chunk_count = 0
        total_length = 0
        
        # Track accumulated text and token counts
        accumulated_text = ""
        last_chunk = False
        
        # Initial token values - will be updated when we get actual metadata
        prompt_token_count = 0
        candidates_token_count = 0
        total_token_count = 0
        
        # Flag to identify if we've seen metadata at least once
        has_seen_metadata = False
        
        try:
            # Yield chunks as they are received
            for chunk in response_stream:
                chunk_count += 1
                
                # Check if this is the last chunk
                if hasattr(chunk, 'finish_reason') and chunk.finish_reason:
                    last_chunk = True
                    finish_reason = chunk.finish_reason
                
                if hasattr(chunk, 'text') and chunk.text:
                    total_length += len(chunk.text)
                    accumulated_text += chunk.text
                    
                    # Extract token info if available from metadata
                    if hasattr(chunk, 'usage_metadata') and chunk.usage_metadata:
                        has_seen_metadata = True
                        # Get prompt tokens (should be stable across chunks)
                        if hasattr(chunk.usage_metadata, 'prompt_token_count'):
                            prompt_token_count = chunk.usage_metadata.prompt_token_count or 0
                        
                        # Get candidate tokens (increases with each chunk)
                        if hasattr(chunk.usage_metadata, 'candidates_token_count'):
                            candidates_token_count = chunk.usage_metadata.candidates_token_count or 0
                        
                        # Get total tokens (should be prompt + candidates)
                        if hasattr(chunk.usage_metadata, 'total_token_count'):
                            total_token_count = chunk.usage_metadata.total_token_count or 0
                        else:
                            total_token_count = prompt_token_count + candidates_token_count
                    
                    # If we've never seen metadata, estimate more conservatively
                    # The Gemini docs say 4 chars ≈ 1 token
                    if not has_seen_metadata:
                        # Only estimate candidates token count based on response text
                        candidates_token_count = len(accumulated_text) // 4
                        total_token_count = prompt_token_count + candidates_token_count
                    
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
                            "totalTokenCount": prompt_token_count + candidates_token_count,
                            "promptTokensDetails": [
                                {
                                    "modality": "TEXT",
                                    "tokenCount": prompt_token_count
                                }
                            ]
                        },
                        "modelVersion": model_name
                    }
                    
                    # Add finish_reason and complete token metadata for the last chunk
                    if last_chunk:
                        if 'finish_reason' in locals():
                            response_data["candidates"][0]["finishReason"] = finish_reason
                        
                        # Always include candidatesTokenCount in final chunk 
                        # (matches Google's API pattern)
                        response_data["usageMetadata"]["candidatesTokenCount"] = candidates_token_count
                        response_data["usageMetadata"]["candidatesTokensDetails"] = [
                            {
                                "modality": "TEXT",
                                "tokenCount": candidates_token_count
                            }
                        ]
                    
                    # Log progress periodically
                    if chunk_count % 10 == 0:
                        elapsed = time.time() - start_time
                        logger.info(f"📝 STREAMING PROGRESS: {chunk_count} chunks, {total_length} chars in {elapsed:.2f}s")
                    
                    # Format as SSE
                    yield f"data: {json.dumps(response_data)}\n\n"
            
            # Log completion
            generation_time = time.time() - start_time
            logger.info(f"✅ STREAMING COMPLETE: {chunk_count} chunks, {total_length} chars in {generation_time:.2f}s")
            logger.info(f"📊 TOKEN STATS: prompt={prompt_token_count}, generated={candidates_token_count}, total={prompt_token_count + candidates_token_count}")
            
        except Exception as exc:
            logger.error(f"❌ STREAMING ERROR: {exc}")
            error_data = {
                "error": {
                    "message": f"An error occurred while processing your request: {str(exc)}"
                }
            }
            yield f"data: {json.dumps(error_data)}\n\n"
