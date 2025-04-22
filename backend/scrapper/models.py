from django.db import models


class SearchQuery(models.Model):
    """Model to store search queries."""
    query = models.CharField(max_length=500)
    engine = models.CharField(max_length=20)  # google, bing, duckduckgo, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.query} ({self.engine})"
    
    class Meta:
        db_table = 'search_queries'
        app_label = 'scrapper'
        verbose_name_plural = 'Search Queries'


class SearchResult(models.Model):
    """Model to store search results."""
    search_query = models.ForeignKey(SearchQuery, on_delete=models.CASCADE, related_name='results')
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=1000)
    description = models.TextField(blank=True, null=True)
    position = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        db_table = 'search_results'
        app_label = 'scrapper'
        verbose_name_plural = 'Search Results'


class Proxy(models.Model):
    """Model to store proxy server information."""
    ip = models.CharField(max_length=50)
    port = models.IntegerField()
    protocol = models.CharField(max_length=10, default='http')  # http or https
    username = models.CharField(max_length=100, blank=True, null=True)
    password = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    success_rate = models.FloatField(default=100.0)  # Percentage of successful requests
    last_checked = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.protocol}://{self.ip}:{self.port}"
    
    class Meta:
        db_table = 'proxies'
        app_label = 'scrapper'
        verbose_name_plural = 'Proxies'
        unique_together = ('ip', 'port')
