"""
Custom authentication backend for cookie-based JWT authentication.

This module provides a CookieJWTAuthentication class that checks for tokens
in cookies first, then falls back to standard header authentication.
"""

from typing import Optional, Tuple, Any
from django.utils.module_loading import import_string
from rest_framework.request import Request


class CookieJWTAuthentication:
    """
    Custom JWT authentication that checks for tokens in cookies first,
    then falls back to standard header authentication.
    """
    
    def __init__(self):
        """
        Initialize the authentication class with lazy imports to avoid circular dependencies.
        """
        self._jwt_auth = None
    
    @property
    def jwt_auth(self):
        """
        Lazy instantiation of JWTAuthentication to avoid circular imports.
        """
        if self._jwt_auth is None:
            # Import JWTAuthentication class lazily when first needed
            JWTAuthentication = import_string('rest_framework_simplejwt.authentication.JWTAuthentication')
            self._jwt_auth = JWTAuthentication()
        return self._jwt_auth
    
    def authenticate(self, request: Request) -> Optional[Tuple[Any, Any]]:
        """
        Attempt to authenticate the request using JWT token from cookies or headers.
        
        Args:
            request: Request object
            
        Returns:
            A tuple of (user, token) if authentication succeeds, None otherwise
        """
        # First, try to get token from cookie
        access_token = request.COOKIES.get('access_token')
        
        if access_token:
            # If token found in cookie, manually set the Authorization header
            # so that JWT authentication can proceed normally
            request.META['HTTP_AUTHORIZATION'] = f"Bearer {access_token}"
        
        # Use standard JWT authentication
        return self.jwt_auth.authenticate(request)
        
    def authenticate_header(self, request: Request) -> str:
        """
        Return the authentication header to use for 401 responses.
        
        This method is required by DRF's authentication system and is called when
        authentication fails to determine what should be sent in the WWW-Authenticate
        header of the 401 response.
        
        Args:
            request: Request object
        
        Returns:
            String containing the value for the WWW-Authenticate header
        """
        # Delegate to the underlying JWT authentication class
        return self.jwt_auth.authenticate_header(request)