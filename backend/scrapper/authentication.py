from rest_framework.authentication import BaseAuthentication

class NoAuthenticationAsync(BaseAuthentication):
    """
    Authentication class that doesn't perform any database operations.
    To be used with async views where we want to bypass DRF's default authentication.
    """
    
    def authenticate(self, request):
        # Return None to indicate that authentication wasn't attempted
        # This will allow the request to proceed without attempting DB access
        return None
