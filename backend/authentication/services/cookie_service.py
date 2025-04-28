from typing import Dict, Any, Optional
from django.http import HttpResponse


def set_auth_cookies(
    response: HttpResponse,
    access_token: str,
    refresh_token: str,
    access_token_max_age: int = 3600,  # 1 hour
    refresh_token_max_age: int = 86400  # 1 day
) -> HttpResponse:
    """
    Set authentication cookies on the response.
    
    Args:
        response: The Django HTTP response
        access_token: JWT access token
        refresh_token: JWT refresh token
        access_token_max_age: Max age for access token cookie in seconds
        refresh_token_max_age: Max age for refresh token cookie in seconds
        
    Returns:
        HttpResponse with cookies set
    """
    # Set access token cookie
    response.set_cookie(
        'access_token',
        access_token,
        max_age=access_token_max_age,
        httponly=False,  # False to allow JS access for API calls
        samesite='None',  # Allow cross-site requests
        secure=True,      # Only send over HTTPS
        path='/',         # Available across the entire domain
    )
    
    # Set refresh token cookie
    response.set_cookie(
        'refresh_token',
        refresh_token,
        max_age=refresh_token_max_age,
        httponly=False,  # False to allow JS access
        samesite='None',  # Allow cross-site requests
        secure=True,     # Only send over HTTPS
        path='/',        # Available across the entire domain
    )
    
    return response


def clear_auth_cookies(response: HttpResponse) -> HttpResponse:
    """
    Clear authentication cookies from the response.
    
    Args:
        response: The Django HTTP response
        
    Returns:
        HttpResponse with cookies cleared
    """
    # Delete access token cookie - only use supported parameters
    response.delete_cookie(
        'access_token',
        path='/',
        samesite='None',
    )
    
    # Delete refresh token cookie - only use supported parameters
    response.delete_cookie(
        'refresh_token',
        path='/',
        samesite='None',
    )
    
    return response