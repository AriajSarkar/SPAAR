from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer,
    UserLoginSerializer,
    LogoutSerializer
)
from .services.user_service import register_user, authenticate_user, generate_tokens_for_user, logout_user
from .services.cookie_service import set_auth_cookies, clear_auth_cookies


class RegisterView(APIView):
    """API view for user registration."""
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_summary="Register a new user",
        operation_description="Register with email, first_name, last_name, and password",
        request_body=UserRegistrationSerializer,
        responses={
            201: openapi.Response(
                description="User successfully registered",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'tokens': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'access': openapi.Schema(type=openapi.TYPE_STRING),
                                'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            400: "Bad Request"
        }
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user, error = register_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data['first_name'],
                last_name=serializer.validated_data['last_name']
            )
            
            if user is None:
                return Response({'error': error}, status=status.HTTP_400_BAD_REQUEST)
                
            # Generate tokens
            tokens = generate_tokens_for_user(user)
            
            # Create response with user data and tokens
            response = Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
            
            # Set auth cookies
            set_auth_cookies(
                response=response,
                access_token=tokens['access'],
                refresh_token=tokens['refresh']
            )
            
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """API view for user login."""
    permission_classes = [AllowAny]
    
    @swagger_auto_schema(
        operation_summary="User login",
        operation_description="Login with email and password",
        request_body=UserLoginSerializer,
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'user': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'tokens': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'access': openapi.Schema(type=openapi.TYPE_STRING),
                                'refresh': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            401: "Unauthorized"
        }
    )
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user, error = authenticate_user(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if user is None:
                return Response({'error': error}, status=status.HTTP_401_UNAUTHORIZED)
                
            # Generate tokens
            tokens = generate_tokens_for_user(user)
            
            # Create response with user data and tokens
            response = Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            })
            
            # Set auth cookies
            set_auth_cookies(
                response=response,
                access_token=tokens['access'],
                refresh_token=tokens['refresh']
            )
            
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """API view for user logout."""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="User logout",
        operation_description="Logout and invalidate the refresh token",
        request_body=LogoutSerializer,
        responses={
            200: openapi.Response(
                description="Logout successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'success': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            400: "Bad Request"
        }
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            # Call the service to blacklist the token
            success, error = logout_user(
                refresh_token=serializer.validated_data['refresh_token']
            )
            
            if not success:
                return Response({
                    'success': False,
                    'message': f"Logout failed: {error}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create success response
            response = Response({
                'success': True,
                'message': "Successfully logged out"
            })
            
            # Clear auth cookies using the service
            clear_auth_cookies(response)
            
            return response
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """API view for user profile operations."""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_summary="Get current user profile",
        operation_description="Returns the profile of the currently authenticated user",
        responses={
            200: UserSerializer,
            401: "Unauthorized"
        }
    )
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_summary="Update current user profile",
        operation_description="Update the first name or last name of the currently authenticated user",
        request_body=UserSerializer,
        responses={
            200: UserSerializer,
            400: "Bad Request",
            401: "Unauthorized"
        }
    )
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
