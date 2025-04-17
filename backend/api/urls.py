from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

# Add a simple root endpoint to verify API is working
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    return Response({
        "status": "API is running",
        "version": "1.0",
        "endpoints": {
            "search": "/api/v1/search/?q=your_query",
            "history": "/api/v1/search/history/",
            "results": "/api/v1/search/results/{id}/"
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('v1/', include('scrapper.urls')),
]
