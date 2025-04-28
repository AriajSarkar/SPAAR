from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from . import views

# Add a simple root endpoint to verify API is running
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "status": "API is running",
        "version": "1.0",
        "endpoints": {
            "search": "/api/v1/search/?q=your_query",
            "history": "/api/v1/search/history/",
            "results": "/api/v1/search/results/{id}/",
            "llm": {
                "generate": "/api/v1/llm/generate/ - POST with JSON: {\"prompt\": \"Your question or request\", \"session_id\": \"optional-id\", \"include_history\": true}",
                "history": "/api/v1/llm/conversation/{session_id}/",
                "delete": "/api/v1/llm/conversation/{session_id}/delete/"
            },
            "user_content": {
                "all": "/api/user-content/",
                "specific": "/api/user-content/{session_id}/"
            },
            "auth": {
                "register": "/api/auth/register/",
                "login": "/api/auth/login/",
                "logout": "/api/auth/logout/",
                "refresh": "/api/auth/refresh/",
                "profile": "/api/auth/profile/"
            }
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('v1/', include('scrapper.urls')),
    path('v1/llm/', include('llm.urls', namespace='llm')),
    # User content history endpoints
    path('user-content/', views.user_content_history, name='user-content-history'),
    path('user-content/<str:session_id>/', views.user_content_history, name='user-content-history-detail'),
]
