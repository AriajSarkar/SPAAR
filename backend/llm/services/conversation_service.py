from typing import List, Dict, Any, Optional, Tuple, Union
import uuid
import logging

from django.contrib.auth import get_user_model
from ..models import LlmConversation, LlmMessage

User = get_user_model()
logger = logging.getLogger(__name__)


def get_or_create_conversation(session_id: Optional[str], user: Optional[User]) -> Tuple[LlmConversation, bool]:
    """
    Get an existing conversation or create a new one, associating it with the user.
    
    Args:
        session_id: Optional session ID
        user: Optional authenticated user
        
    Returns:
        Tuple[LlmConversation, bool]: The conversation and whether it was created
    """
    if not session_id:
        session_id = str(uuid.uuid4())
        created = True
        conversation = LlmConversation(session_id=session_id)
        if user and user.is_authenticated:
            conversation.user = user
        conversation.save()
        return conversation, created
        
    try:
        conversation = LlmConversation.objects.get(session_id=session_id)
        
        # If the conversation exists but doesn't have a user, and we have an authenticated user,
        # associate the conversation with the user
        if user and user.is_authenticated and not conversation.user:
            conversation.user = user
            conversation.save()
            
        # Verify the user has permission to access this conversation
        if conversation.user and user and conversation.user.id != user.id:
            # User trying to access another user's conversation
            return None, False
            
        return conversation, False
    except LlmConversation.DoesNotExist:
        # Create new conversation with this session ID
        conversation = LlmConversation(session_id=session_id)
        if user and user.is_authenticated:
            conversation.user = user
        conversation.save()
        return conversation, True


def get_user_conversations(user: User) -> List[LlmConversation]:
    """
    Get all conversations for a specific user.
    
    Args:
        user: Authenticated user
        
    Returns:
        List[LlmConversation]: List of the user's conversations
    """
    if not user or not user.is_authenticated:
        return []
        
    return LlmConversation.objects.filter(user=user).order_by('-updated_at')


def get_conversation_if_authorized(session_id: str, user: Optional[User]) -> Optional[LlmConversation]:
    """
    Get a conversation only if the user is authorized to access it.
    
    Args:
        session_id: The session ID to retrieve
        user: The authenticated user making the request
        
    Returns:
        Optional[LlmConversation]: The conversation if authorized, None otherwise
    """
    try:
        conversation = LlmConversation.objects.get(session_id=session_id)
        
        # Check if this conversation belongs to a user
        if conversation.user:
            # If it belongs to a user, check if it's the current user
            if not user or not user.is_authenticated or conversation.user.id != user.id:
                logger.warning(f"Unauthorized access attempt to session {session_id}")
                return None
                
        return conversation
    except LlmConversation.DoesNotExist:
        return None


def delete_conversation_if_authorized(session_id: str, user: Optional[User]) -> Tuple[bool, str, int]:
    """
    Delete a conversation if the user is authorized.
    
    Args:
        session_id: The session ID to delete
        user: The authenticated user making the request
        
    Returns:
        Tuple[bool, str, int]: Success status, message, and message count
    """
    conversation = get_conversation_if_authorized(session_id, user)
    if not conversation:
        return False, f"Conversation with session_id '{session_id}' not found or not authorized", 0
    
    # Count messages for logging
    messages_count = LlmMessage.objects.filter(conversation=conversation).count()
    
    # Delete messages and conversation
    LlmMessage.objects.filter(conversation=conversation).delete()
    conversation.delete()
    
    logger.info(f"🗑️ DELETED CONVERSATION: Session ID '{session_id}' with {messages_count} messages")
    return True, f"Conversation with session_id '{session_id}' and all its messages deleted successfully", messages_count


def get_conversation_messages(conversation: LlmConversation) -> List[Dict[str, Any]]:
    """
    Get all messages for a conversation formatted for API response.
    
    Args:
        conversation: The conversation to get messages for
        
    Returns:
        List[Dict[str, Any]]: Formatted message history
    """
    messages = LlmMessage.objects.filter(conversation=conversation).order_by('created_at')
    history = []
    
    for msg in messages:
        history.append({
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat()
        })
    
    return history