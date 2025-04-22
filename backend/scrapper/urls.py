from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.search_view, name='search'),
    path('search/async/', views.async_search_view, name='async-search'),
    path('search/history/', views.search_history, name='search-history'),
    path('search/results/<int:query_id>/', views.search_results, name='search-results'),
]
