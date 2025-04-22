import logging
import requests
import concurrent.futures
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

from .models import Proxy

logger = logging.getLogger(__name__)


class ProxyFetcher:
    """Fetches proxy lists from various free proxy sources."""
    
    def __init__(self):
        self.user_agent = UserAgent()
    
    def fetch_from_free_proxy_list(self) -> List[Dict[str, Any]]:
        """Fetch proxies from free-proxy-list.net."""
        try:
            headers = {'User-Agent': self.user_agent.random}
            response = requests.get('https://free-proxy-list.net/', headers=headers, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            proxies = []
            table = soup.find('table')
            if not table:
                logger.error("Could not find proxy table on free-proxy-list.net")
                return []
            
            rows = table.find_all('tr')
            for row in rows[1:]:  # Skip header row
                cols = row.find_all('td')
                if len(cols) >= 8:
                    ip = cols[0].text
                    port = cols[1].text
                    https = cols[6].text == 'yes'
                    
                    proxies.append({
                        'ip': ip,
                        'port': int(port),
                        'protocol': 'https' if https else 'http',
                        'username': None,
                        'password': None
                    })
            
            return proxies
        except Exception as e:
            logger.error(f"Error fetching proxies from free-proxy-list.net: {e}")
            return []
    
    def fetch_from_geonode(self) -> List[Dict[str, Any]]:
        """Fetch proxies from geonode.com API."""
        try:
            response = requests.get(
                'https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc',
                timeout=10
            )
            data = response.json()
            
            proxies = []
            for proxy in data.get('data', []):
                proxies.append({
                    'ip': proxy.get('ip'),
                    'port': int(proxy.get('port')),
                    'protocol': proxy.get('protocols', ['http'])[0].lower(),
                    'username': None,
                    'password': None
                })
            
            return proxies
        except Exception as e:
            logger.error(f"Error fetching proxies from geonode: {e}")
            return []
    
    def fetch_all(self) -> List[Dict[str, Any]]:
        """Fetch proxies from all sources and combine them."""
        proxies = []
        proxies.extend(self.fetch_from_free_proxy_list())
        proxies.extend(self.fetch_from_geonode())
        return proxies


class ProxyValidator:
    """Validates that proxies are working."""
    
    def __init__(self, test_url='https://www.google.com'):
        self.test_url = test_url
        self.user_agent = UserAgent()
    
    def validate(self, proxy: Dict[str, Any]) -> bool:
        """Test if a proxy works."""
        proxies = {
            'http': f"{proxy['protocol']}://{proxy['ip']}:{proxy['port']}",
            'https': f"{proxy['protocol']}://{proxy['ip']}:{proxy['port']}"
        }
        
        headers = {'User-Agent': self.user_agent.random}
        
        try:
            response = requests.get(self.test_url, 
                                    proxies=proxies, 
                                    headers=headers, 
                                    timeout=10)
            return response.status_code == 200
        except:
            return False
    
    def validate_bulk(self, proxies: List[Dict[str, Any]], max_workers=10) -> List[Dict[str, Any]]:
        """Validate multiple proxies in parallel."""
        valid_proxies = []
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Submit validation tasks
            future_to_proxy = {executor.submit(self.validate, proxy): proxy for proxy in proxies}
            
            # Process results as they complete
            for future in concurrent.futures.as_completed(future_to_proxy):
                proxy = future_to_proxy[future]
                try:
                    is_valid = future.result()
                    if is_valid:
                        valid_proxies.append(proxy)
                except Exception as e:
                    logger.error(f"Error validating proxy {proxy['ip']}:{proxy['port']}: {e}")
        
        return valid_proxies


class ProxyManager:
    """Manages the proxy collection in database."""
    
    def update_proxy_list(self):
        """Fetch new proxies, validate them, and update the database."""
        # Fetch proxies from various sources
        fetcher = ProxyFetcher()
        proxies = fetcher.fetch_all()
        
        # Validate proxies
        validator = ProxyValidator()
        valid_proxies = validator.validate_bulk(proxies)
        
        # Update database
        for proxy_data in valid_proxies:
            Proxy.objects.update_or_create(
                ip=proxy_data['ip'],
                port=proxy_data['port'],
                defaults={
                    'protocol': proxy_data['protocol'],
                    'username': proxy_data['username'],
                    'password': proxy_data['password'],
                    'is_active': True,
                    'success_rate': 100.0
                }
            )
        
        return len(valid_proxies)
