from django.urls import path
from . import views

app_name = 'llm'

urlpatterns = [
    path('generate/', views.generate_text, name='generate_text'),
    path('conversation/<str:session_id>/', views.get_conversation_history, name='get_conversation_history'),
    path('conversation/<str:session_id>/delete/', views.delete_conversation, name='delete_conversation'),
]
