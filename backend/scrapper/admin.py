from django.contrib import admin
from .models import SearchQuery, SearchResult, Proxy

@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('query', 'engine', 'created_at')
    list_filter = ('engine', 'created_at')
    search_fields = ('query',)

@admin.register(SearchResult)
class SearchResultAdmin(admin.ModelAdmin):
    list_display = ('title', 'url', 'position', 'created_at')
    list_filter = ('search_query__engine', 'created_at')
    search_fields = ('title', 'url', 'description')

@admin.register(Proxy)
class ProxyAdmin(admin.ModelAdmin):
    list_display = ('ip', 'port', 'protocol', 'is_active', 'success_rate', 'last_checked')
    list_filter = ('protocol', 'is_active')
    search_fields = ('ip',)
