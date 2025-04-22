import asyncio
import random
import logging
import concurrent.futures
import os
import json
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Any, Optional, Tuple

import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from requests.exceptions import RequestException

from .models import Proxy, SearchQuery, SearchResult

logger = logging.getLogger(__name__)


def get_public_ip() -> str:
    """Get the server's public IP address."""
    try:
        response = requests.get('https://api.ipify.org?format=json', timeout=5)
        if response.status_code == 200:
            return response.json().get('ip', 'unknown')
        return 'unknown'
    except Exception as e:
        logger.error(f"Error getting public IP: {e}")
        return 'unknown'


class ProxyManager:
    """Manages proxies for search requests."""
    
    def __init__(self):
        # Force disable proxies regardless of environment setting
        self.use_proxies = False
        logger.info("Proxies are disabled. Using direct connections only.")
        self.proxies = []
    
    def _load_proxies(self) -> List[Proxy]:
        """Load active proxies from database."""
        return []  # Always return empty list
    
    def get_random_proxy(self) -> Optional[Proxy]:
        """Get a random proxy from the pool."""
        return None  # Always return None to ensure no proxies are used
    
    def format_proxy(self, proxy: Proxy) -> Dict[str, str]:
        """Format proxy for requests library."""
        return None  # Always return None
    
    def update_proxy_status(self, proxy: Proxy, success: bool):
        """Update proxy success rate."""
        pass  # No-op since we're not using proxies


class SearchEngine:
    """Base class for search engines."""
    
    def __init__(self, proxy_manager: ProxyManager = None):
        self.proxy_manager = proxy_manager or ProxyManager()
        self.user_agent = UserAgent()
    
    def search(self, query: str) -> Tuple[List[Dict[str, Any]], str]:
        """Execute search query and return results with IP used."""
        raise NotImplementedError("Subclasses must implement this method")
    
    def _make_request(self, url: str, params: Dict[str, Any] = None) -> Tuple[Optional[str], str]:
        """Make HTTP request using direct connection only.
        Returns tuple of (response_text, ip_address_used)
        """
        # Get the server's public IP before making the request
        server_ip = get_public_ip()
        ip_used = f"direct ({server_ip})"
        
        headers = {
            "User-Agent": self.user_agent.random,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        
        logger.info(f"Making direct request to {url} using {ip_used}")
        
        try:
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=20
            )
            response.raise_for_status()
            return response.text, ip_used
        except RequestException as e:
            logger.error(f"Direct request failed: {e}")
            return None, ip_used


class GoogleSearch(SearchEngine):
    """Google search implementation."""
    
    def search(self, query: str) -> Tuple[List[Dict[str, Any]], str]:
        url = "https://www.google.com/search"
        params = {"q": query, "num": 10}
        
        html, ip_used = self._make_request(url, params)
        if not html:
            return [], ip_used
        
        return self._parse_google_results(html), ip_used
    
    def _parse_google_results(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        
        for index, result in enumerate(soup.select("div.g")):
            title_element = result.select_one("h3")
            link_element = result.select_one("a")
            snippet_element = result.select_one("div.VwiC3b")
            
            if title_element and link_element:
                title = title_element.text
                url = link_element.get("href")
                description = snippet_element.text if snippet_element else ""
                
                if url.startswith("/url?q="):
                    url = url.split("/url?q=")[1].split("&")[0]
                
                results.append({
                    "title": title,
                    "url": url,
                    "description": description,
                    "position": index + 1
                })
        
        return results


class BingSearch(SearchEngine):
    """Bing search implementation."""
    
    def search(self, query: str) -> Tuple[List[Dict[str, Any]], str]:
        url = "https://www.bing.com/search"
        params = {"q": query, "count": 10}
        
        html, ip_used = self._make_request(url, params)
        if not html:
            return [], ip_used
        
        return self._parse_bing_results(html), ip_used
    
    def _parse_bing_results(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        
        for index, result in enumerate(soup.select("li.b_algo")):
            title_element = result.select_one("h2")
            link_element = result.select_one("h2 a")
            snippet_element = result.select_one("div.b_caption p")
            
            if title_element and link_element:
                title = title_element.text
                url = link_element.get("href")
                description = snippet_element.text if snippet_element else ""
                
                results.append({
                    "title": title,
                    "url": url,
                    "description": description,
                    "position": index + 1
                })
        
        return results


class DuckDuckGoSearch(SearchEngine):
    """DuckDuckGo search implementation."""
    
    def search(self, query: str) -> Tuple[List[Dict[str, Any]], str]:
        url = "https://html.duckduckgo.com/html"
        params = {"q": query}
        
        html, ip_used = self._make_request(url, params)
        if not html:
            return [], ip_used
        
        return self._parse_ddg_results(html), ip_used
    
    def _parse_ddg_results(self, html: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        results = []
        
        for index, result in enumerate(soup.select(".result")):
            title_element = result.select_one(".result__title")
            link_element = result.select_one(".result__url")
            snippet_element = result.select_one(".result__snippet")
            
            if title_element and link_element:
                title = title_element.text.strip()
                url = link_element.text.strip()
                description = snippet_element.text.strip() if snippet_element else ""
                
                if not url.startswith(("http://", "https://")):
                    url = "https://" + url
                
                results.append({
                    "title": title,
                    "url": url,
                    "description": description,
                    "position": index + 1
                })
        
        return results


class MultiEngineSearch:
    """Search multiple engines in parallel and merge results."""
    
    def __init__(self):
        proxy_manager = ProxyManager()
        self.engines = {
            "google": GoogleSearch(proxy_manager),
            "bing": BingSearch(proxy_manager),
            "duckduckgo": DuckDuckGoSearch(proxy_manager),
        }
        self.executor = ThreadPoolExecutor(max_workers=10)
        # Add flag to control database operations
        self.save_to_db = os.environ.get("SAVE_SEARCH_RESULTS", "true").lower() == "true"
    
    def search_sync(self, query: str, engines: List[str] = None) -> Dict[str, Any]:
        """Synchronous version of search that works with ThreadPoolExecutor."""
        if not engines:
            engines = list(self.engines.keys())
        
        # Validate requested engines
        engines = [e for e in engines if e in self.engines]
        
        # Execute searches in parallel using ThreadPoolExecutor
        results_dict = {}
        ip_used_dict = {}
        errors_dict = {}
        
        # Initialize all engines with empty results
        for engine_name in engines:
            results_dict[engine_name] = []
            errors_dict[engine_name] = None
        
        try:
            with ThreadPoolExecutor(max_workers=len(engines)) as executor:
                future_to_engine = {
                    executor.submit(self.engines[e].search, query): e 
                    for e in engines
                }
                
                # Process results as they complete
                for future in concurrent.futures.as_completed(future_to_engine):
                    engine_name = future_to_engine[future]
                    try:
                        results, ip_used = future.result()
                        results_dict[engine_name] = results
                        ip_used_dict[engine_name] = ip_used
                        
                        # Only try to save to DB if enabled and we have results
                        if self.save_to_db and results:
                            try:
                                # Create search query records
                                search_query = SearchQuery(query=query, engine=engine_name)
                                search_query.save()
                                
                                # Create search result records
                                for result in results:
                                    SearchResult.objects.create(
                                        search_query=search_query,
                                        title=result["title"],
                                        url=result["url"],
                                        description=result["description"],
                                        position=result["position"]
                                    )
                            except Exception as db_error:
                                # Log but don't fail if DB operations fail
                                logger.error(f"Database error saving {engine_name} results: {db_error}")
                                errors_dict[engine_name] = f"Results found but not saved: {str(db_error)}"
                        elif not results:
                            logger.warning(f"No results found from {engine_name} for query: {query}")
                    except Exception as e:
                        logger.error(f"Error in {engine_name} search: {e}")
                        errors_dict[engine_name] = str(e)
        except Exception as e:
            logger.error(f"Error in multi-engine search: {e}")
        
        # Return search results, IP addresses used, and any errors
        return {
            "results": results_dict,
            "ip_used": ip_used_dict,
            "errors": errors_dict
        }
    
    async def search(self, query: str, engines: List[str] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Search across multiple engines in parallel."""
        if not engines:
            engines = list(self.engines.keys())
        
        # Validate requested engines
        engines = [e for e in engines if e in self.engines]
        
        loop = asyncio.get_event_loop()
        tasks = []
        
        for engine_name in engines:
            engine = self.engines.get(engine_name)
            if engine:
                # Run search in thread pool to avoid blocking
                tasks.append(
                    loop.run_in_executor(
                        self.executor,
                        engine.search,
                        query
                    )
                )
        
        results = await asyncio.gather(*tasks)
        
        # Create search query records
        search_queries = []
        for i, engine_name in enumerate(engines):
            search_query = SearchQuery(query=query, engine=engine_name)
            search_query.save()
            
            # Create search result records
            for result in results[i]:
                SearchResult.objects.create(
                    search_query=search_query,
                    title=result["title"],
                    url=result["url"],
                    description=result["description"],
                    position=result["position"]
                )
            
            search_queries.append(search_query)
        
        # Combine results with engine names
        combined_results = {}
        for i, engine_name in enumerate(engines):
            combined_results[engine_name] = results[i]
        
        return combined_results
