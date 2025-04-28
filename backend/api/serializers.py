from rest_framework import serializers
from llm.models import LlmConversation, LlmMessage


class UserMessageSerializer(serializers.ModelSerializer):
    """Serializer for displaying user messages in a conversation."""    
    
    class Meta:
        model = LlmMessage
        fields = ['role', 'content', 'created_at']


class UserHistorySerializer(serializers.ModelSerializer):
    """Serializer for displaying conversation session ID and user history."""
    history = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    
    class Meta:
        model = LlmConversation
        fields = ['session_id', 'history', 'user_email']
    
    def get_history(self, obj):
        """Filter only user messages from the conversation."""
        # Only get messages with role="user"
        messages = LlmMessage.objects.filter(conversation=obj, role="user")
        return UserMessageSerializer(messages, many=True).data
    
    def get_user_email(self, obj):
        """Return the email of the user who owns this conversation."""
        return obj.user.email if obj.user else None