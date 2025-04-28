from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from llm.models import LlmConversation
from llm.services.conversation_service import (
    get_user_conversations,
    get_conversation_if_authorized, 
    get_conversation_messages
)
from .serializers import UserHistorySerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_content_history(request, session_id=None):
    """
    API endpoint for retrieving only user content history.
    Returns session_id and history containing only user messages for the authenticated user.
    
    Args:
        session_id: Optional ID of the conversation to retrieve
        
    Returns:
        session_id and history of user messages in the conversation
    """
    try:
        if session_id:
            # Get specific conversation if authorized
            conversation = get_conversation_if_authorized(session_id, request.user)
            
            if not conversation:
                return Response(
                    {"error": f"Conversation with session_id '{session_id}' not found or you are not authorized to access it"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            serializer = UserHistorySerializer(conversation)
            return Response(serializer.data)
        else:
            # Get all conversations for the authenticated user
            conversations = get_user_conversations(request.user)
            serializer = UserHistorySerializer(conversations, many=True)
            return Response(serializer.data)
            
    except Exception as e:
        return Response(
            {"error": f"Failed to retrieve user content history: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
