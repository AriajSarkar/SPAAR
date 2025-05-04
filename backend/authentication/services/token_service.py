"""
Token service for managing JWT tokens including cookie-based handling.

This module provides a custom token refresh implementation that works with cookies,
using lazy imports to avoid circular dependencies with Django REST Framework.
"""

from typing import Dict, Any, Optional, Type, ClassVar
from django.utils.module_loading import import_string
from rest_framework.response import Response
from rest_framework import status

from .cookie_service import set_auth_cookies


class CookieTokenRefreshView:
    """
    Custom token refresh view that reads the refresh token from cookies
    and sets the new tokens as cookies in the response.
    
    This is a proxy class that delegates to the actual implementation to avoid
    circular imports. The actual implementation is dynamically created when
    first accessed.
    """
    _view_class = None
    
    @classmethod
    def as_view(cls, **initkwargs):
        """
        Return the actual view function for processing requests.
        
        This delegates to the dynamically created view class that inherits from
        TokenRefreshView.
        """
        if cls._view_class is None:
            # Import the parent class dynamically to avoid circular imports
            TokenRefreshView = import_string('rest_framework_simplejwt.views.TokenRefreshView')
            
            # Create a new class that inherits from TokenRefreshView
            class DynamicCookieTokenRefreshView(TokenRefreshView):
                def post(self, request, *args, **kwargs):
                    """
                    Process token refresh request using cookies.
                    
                    Args:
                        request: HTTP request object
                        
                    Returns:
                        Response with refreshed tokens
                    """
                    # Get refresh token from cookie if not in request data
                    refresh_token = request.COOKIES.get('refresh_token')
                    
                    if refresh_token and 'refresh' not in request.data:
                        # Copy request.data to make it mutable if it's immutable
                        if hasattr(request.data, '_mutable'):
                            original_mutable = request.data._mutable
                            request.data._mutable = True
                        
                        request.data['refresh'] = refresh_token
                        
                        # Restore mutability state
                        if hasattr(request.data, '_mutable'):
                            request.data._mutable = original_mutable
                        
                    # Call the parent class to validate and refresh the token
                    try:
                        response = super().post(request, *args, **kwargs)
                        
                        # If successful, set the new tokens as cookies
                        if response.status_code == status.HTTP_200_OK and 'access' in response.data:
                            set_auth_cookies(
                                response=response,
                                access_token=response.data['access'],
                                # If refresh token was rotated, use the new one
                                refresh_token=response.data.get('refresh', refresh_token)
                            )
                            
                        return response
                        
                    except Exception as e:
                        return Response(
                            {"error": f"Invalid or expired refresh token: {str(e)}"},
                            status=status.HTTP_401_UNAUTHORIZED
                        )
            
            cls._view_class = DynamicCookieTokenRefreshView
        
        # Return the as_view method from the dynamic class
        return cls._view_class.as_view(**initkwargs)