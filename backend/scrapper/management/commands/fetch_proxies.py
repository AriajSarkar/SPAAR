import logging
from django.core.management.base import BaseCommand
from scrapper.proxy import ProxyManager

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetches and validates proxies from various sources'
    
    def handle(self, *args, **kwargs):
        self.stdout.write('Fetching and validating proxies...')
        
        try:
            manager = ProxyManager()
            count = manager.update_proxy_list()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully added {count} valid proxies to database.'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching proxies: {e}'))
            logger.exception("Error in fetch_proxies command")
