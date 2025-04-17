import json
import logging
import uuid
from typing import Dict, List, Any

from django.http import StreamingHttpResponse, JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .services import GeminiService
from .models import LlmConversation, LlmMessage

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def generate_text(request):
    """
    API endpoint for generating text using Gemini.
    Always returns streaming responses.
    
    Request body should be JSON with the following structure:
    {
        "prompt": "Your prompt here",
        "session_id": "optional-session-id-for-conversation-history",
        "include_history": true
    }
    """
    try:
        # Get request data
        data = json.loads(request.body)
        prompt = data.get('prompt')
        session_id = data.get('session_id', str(uuid.uuid4()))
        include_history = data.get('include_history', True)
        
        if not prompt:
            return Response(
                {"error": "Missing required parameter 'prompt'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create conversation
        conversation, created = LlmConversation.objects.get_or_create(session_id=session_id)
        
        # Get conversation history if requested
        conversation_history = []
        if include_history:
            messages = LlmMessage.objects.filter(conversation=conversation).order_by('created_at')
            conversation_history = [{"role": msg.role, "content": msg.content} for msg in messages]
        
        # Save the user prompt
        LlmMessage.objects.create(
            conversation=conversation,
            role="user",
            content=prompt
        )
        
        # Initialize the Gemini service
        gemini_service = GeminiService()
        
        # Store complete response to save to database after streaming
        complete_response = []
        
        def event_stream():
            """Generate events for SSE."""
            try:
                for chunk in gemini_service.generate_text(prompt, conversation_history, stream=True):
                    # Process chunk data
                    try:
                        # Parse the data part of the SSE message
                        if chunk.startswith("data: "):
                            json_data = json.loads(chunk[6:])  # Skip "data: " prefix
                            
                            # Handle error message if present
                            if "error" in json_data:
                                logger.error(f"Error from Gemini API: {json_data['error']}")
                                yield chunk
                                continue
                                
                            # Extract text from candidates if present
                            if "candidates" in json_data and json_data["candidates"]:
                                text = ""
                                for candidate in json_data["candidates"]:
                                    if "content" in candidate and "parts" in candidate["content"]:
                                        for part in candidate["content"]["parts"]:
                                            if "text" in part:
                                                text += part["text"]
                                
                                if text:
                                    complete_response.append(text)
                            
                            # Pass through the original chunk
                            yield chunk
                        else:
                            # If the chunk isn't properly formatted, just pass it through
                            yield chunk
                            
                    except json.JSONDecodeError:
                        logger.warning(f"Couldn't decode JSON from chunk: {chunk}")
                        yield chunk
                    except KeyError as e:
                        logger.warning(f"Missing key in JSON structure: {e}")
                        yield chunk
                
                # After streaming completes, save the assistant's response to database
                if complete_response:
                    LlmMessage.objects.create(
                        conversation=conversation,
                        role="assistant",
                        content="".join(complete_response)
                    )
                
            except Exception as e:
                logger.error(f"Error in streaming: {e}")
                error_data = {
                    "error": {
                        "message": f"Error: {str(e)}"
                    }
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        # Return a streaming response
        return StreamingHttpResponse(
            event_stream(), 
            content_type='text/event-stream'
        )
        
    except Exception as e:
        logger.error(f"Error in generate_text: {e}")
        return Response(
            {"error": f"Failed to generate text: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def get_conversation_history(request, session_id):
    """
    API endpoint for retrieving conversation history.
    
    Args:
        session_id: The ID of the conversation to retrieve
        
    Returns:
        A list of messages in the conversation
    """
    try:
        conversation = LlmConversation.objects.get(session_id=session_id)
        messages = LlmMessage.objects.filter(conversation=conversation).order_by('created_at')
        
        history = []
        for msg in messages:
            history.append({
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat()
            })
        
        return Response({"history": history, "session_id": session_id})
        
    except LlmConversation.DoesNotExist:
        return Response(
            {"error": f"Conversation with session_id '{session_id}' not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in get_conversation_history: {e}")
        return Response(
            {"error": f"Failed to retrieve conversation history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_conversation(request, session_id):
    """
    API endpoint for deleting a conversation.
    
    Args:
        session_id: The ID of the conversation to delete
        
    Returns:
        Success or error message
    """
    try:
        try:
            conversation = LlmConversation.objects.get(session_id=session_id)
        except LlmConversation.DoesNotExist:
            return Response(
                {"error": f"Conversation with session_id '{session_id}' not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Delete all messages associated with the conversation
        messages_count = LlmMessage.objects.filter(conversation=conversation).count()
        LlmMessage.objects.filter(conversation=conversation).delete()
        
        # Delete the conversation
        conversation.delete()
        
        logger.info(f"🗑️ DELETED CONVERSATION: Session ID '{session_id}' with {messages_count} messages")
        
        return Response({
            "success": True,
            "message": f"Conversation with session_id '{session_id}' and all its messages deleted successfully"
        })
        
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        return Response(
            {"error": f"Failed to delete conversation: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
