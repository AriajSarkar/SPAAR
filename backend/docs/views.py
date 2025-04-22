from django.shortcuts import render, redirect

def index(request):
    """Redirect root to the Swagger UI."""
    return redirect('schema-swagger-ui')

# Create your views here.
