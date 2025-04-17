from django.db import models


class LlmConversation(models.Model):
    """Model to store conversation history."""
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation {self.session_id}"
    
    class Meta:
        db_table = 'llm_conversations'
        app_label = 'llm'


class LlmMessage(models.Model):
    """Model to store individual messages in a conversation."""
    conversation = models.ForeignKey(LlmConversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20)  # 'user' or 'assistant'
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.role}: {self.content[:30]}..."
    
    class Meta:
        db_table = 'llm_messages'
        app_label = 'llm'
        ordering = ['created_at']
