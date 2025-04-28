"""
User service module for authentication-related operations.

This module handles user authentication, registration, and token management,
maintaining separation of business logic from views.
"""

from typing import Dict, Any, Optional, Tuple
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import User


def generate_tokens_for_user(user: User) -> Dict[str, str]:
    """
    Generate JWT tokens for a user.
    
    Args:
        user: The user to generate tokens for
        
    Returns:
        Dict containing access and refresh tokens
    """
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


def register_user(email: str, password: str, first_name: str, last_name: str) -> Tuple[Optional[User], Optional[str]]:
    """
    Register a new user.
    
    Args:
        email: User's email address
        password: User's password
        first_name: User's first name
        last_name: User's last name
        
    Returns:
        Tuple of (user, error_message)
    """
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return None, "Email already registered"
    
    try:
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        return user, None
    except Exception as e:
        return None, str(e)


def authenticate_user(email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
    """
    Authenticate a user with email and password.
    
    Args:
        email: User's email
        password: User's password
        
    Returns:
        Tuple of (user, error_message)
    """
    user = authenticate(email=email, password=password)
    if user is None:
        return None, "Invalid email or password"
    
    return user, None


def logout_user(refresh_token: str) -> Tuple[bool, Optional[str]]:
    """
    Logout a user by blacklisting their refresh token.
    
    Args:
        refresh_token: JWT refresh token to blacklist
        
    Returns:
        Tuple of (success, error_message)
    """
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return True, None
    except Exception as e:
        return False, str(e)