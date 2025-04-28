from typing import Dict, Any, Optional, Tuple
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


def generate_tokens_for_user(user: User) -> Dict[str, str]:
    """
    Generate JWT tokens for a user.
    
    Args:
        user (User): The user to generate tokens for
        
    Returns:
        Dict[str, str]: Dictionary containing access and refresh tokens
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
        email (str): User's email address
        password (str): User's password
        first_name (str): User's first name
        last_name (str): User's last name
        
    Returns:
        Tuple[Optional[User], Optional[str]]: Tuple of (user, error_message)
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
        email (str): User's email
        password (str): User's password
        
    Returns:
        Tuple[Optional[User], Optional[str]]: Tuple of (user, error_message)
    """
    user = authenticate(email=email, password=password)
    if user is None:
        return None, "Invalid email or password"
    
    return user, None


def logout_user(refresh_token: str) -> Tuple[bool, Optional[str]]:
    """
    Logout a user by blacklisting their refresh token.
    
    Args:
        refresh_token (str): JWT refresh token to blacklist
        
    Returns:
        Tuple[bool, Optional[str]]: Tuple of (success, error_message)
    """
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        return True, None
    except Exception as e:
        return False, str(e)