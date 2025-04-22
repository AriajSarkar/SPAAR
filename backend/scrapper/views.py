import asyncio
import logging
from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from asgiref.sync import sync_to_async, async_to_sync

from .services import MultiEngineSearch
from .models import SearchQuery, SearchResult
from .authentication import NoAuthenticationAsync


@api_view(['GET'])
@permission_classes([AllowAny])  # Make it explicitly public
@authentication_classes([])  # Empty list = no authentication required
def search_view(request):
    """
    API view to perform search across multiple engines.
    This is a synchronous version that calls the search_sync method directly.
    """
    # Log that the view is being accessed
    logger = logging.getLogger(__name__)
    logger.info(f"Search API accessed with query: {request.query_params.get('q', '')}")
    
    query = request.query_params.get('q')
    engines = request.query_params.getlist('engine', ['google', 'bing', 'duckduckgo'])
    
    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the search engine and perform the search synchronously
    search_engine = MultiEngineSearch()
    try:
        search_data = search_engine.search_sync(query, engines)
        
        # Add timestamp and request info to the response
        from datetime import datetime
        search_data["timestamp"] = datetime.now().isoformat()
        search_data["query"] = query
        search_data["request_info"] = {
            "user_agent": request.META.get('HTTP_USER_AGENT', 'Unknown'),
            "remote_addr": request.META.get('REMOTE_ADDR', 'Unknown'),
            "db_storage_enabled": search_engine.save_to_db
        }
        
        # Check for any errors and log them
        has_errors = any(search_data.get('errors', {}).values())
        if has_errors:
            logger.warning(f"Search completed with some errors: {search_data['errors']}")
        
        return Response(search_data)
    except Exception as e:
        logger.error(f"Error performing search: {e}")
        return Response(
            {"error": f"Search failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# Add the missing async_search_view function
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([NoAuthenticationAsync])
async def async_search_view(request):
    """
    API view to perform search across multiple engines asynchronously.
    This is an async version that calls the async search method.
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Async Search API accessed with query: {request.query_params.get('q', '')}")
    
    query = request.query_params.get('q')
    engines = request.query_params.getlist('engine', ['google', 'bing', 'duckduckgo'])
    
    if not query:
        return Response(
            {"error": "Query parameter 'q' is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create the search engine and perform the search asynchronously
    search_engine = MultiEngineSearch()
    try:
        # Use the async version of the search method
        results = await search_engine.search(query, engines)
        
        # Add timestamp and request info to the response
        from datetime import datetime
        
        response_data = {
            "results": results,
            "timestamp": datetime.now().isoformat(),
            "query": query,
            "request_info": {
                "user_agent": request.META.get('HTTP_USER_AGENT', 'Unknown'),
                "remote_addr": request.META.get('REMOTE_ADDR', 'Unknown'),
                "db_storage_enabled": search_engine.save_to_db
            }
        }
        
        return Response(response_data)
    except Exception as e:
        logger.error(f"Error performing async search: {e}")
        return Response(
            {"error": f"Async search failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def search_history(request):
    """
    API view to get search history.
    """
    queries = SearchQuery.objects.all().order_by('-created_at')[:50]
    
    result = []
    for query in queries:
        result.append({
            'id': query.id,
            'query': query.query,
            'engine': query.engine,
            'created_at': query.created_at,
        })
    
    return Response(result)


@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def search_results(request, query_id):
    """
    API view to get results for a specific search query.
    """
    try:
        query = SearchQuery.objects.get(id=query_id)
    except SearchQuery.DoesNotExist:
        return Response(
            {"error": "Search query not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    results = SearchResult.objects.filter(search_query=query).order_by('position')
    
    result = []
    for search_result in results:
        result.append({
            'id': search_result.id,
            'title': search_result.title,
            'url': search_result.url,
            'description': search_result.description,
            'position': search_result.position,
        })
    
    return Response(result)
