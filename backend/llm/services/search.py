"""
Search functionality for enhancing LLM responses.
"""
import time
from typing import Dict, Any

from scrapper.services import MultiEngineSearch
from .config import logger

class SearchUtils:
    """Utilities for performing searches and formatting results."""
    
    def __init__(self):
        self.search_engine = MultiEngineSearch()
    
    def detect_search_needed(self, query: str) -> bool:
        """Determine if a search is needed for this query."""
        keywords = ["current", "recent", "latest", "news", "today", "yesterday", 
                   "this week", "this month", "this year", "update", "score",
                   "happening", "trending", "after 2023", "after 2024", "2025",
                   "search", "look up", "find"]
        
        # Check if any keyword is in the query
        needs_search = any(keyword.lower() in query.lower() for keyword in keywords)
        
        # Log the decision with a nice formatted message
        if needs_search:
            logger.info(f"🔍 SEARCH NEEDED: Query '{query}' appears to need real-time information")
        else:
            logger.info(f"🧠 NO SEARCH NEEDED: Query '{query}' can be answered from model knowledge")
        
        return needs_search
    
    def perform_search_if_needed(self, query: str) -> str:
        """Perform a search if needed and return formatted results."""
        if not self.detect_search_needed(query):
            return ""
        
        try:
            # Log the start of the search
            logger.info(f"🌐 PERFORMING SEARCH: '{query}'")
            start_time = time.time()
            
            # Perform search using the MultiEngineSearch service
            search_results = self.search_engine.search_sync(query)
            
            # Calculate search time
            search_time = time.time() - start_time
            
            # Format the results into a string
            formatted_results = "\nSearch results:\n"
            result_count = 0
            has_google = bool(search_results.get("results", {}).get("google", []))
            has_bing = bool(search_results.get("results", {}).get("bing", []))
            has_ddg = bool(search_results.get("results", {}).get("duckduckgo", []))
            
            # Process Google results first if available
            google_results = search_results.get("results", {}).get("google", [])
            if google_results:
                logger.info(f"📊 GOOGLE RESULTS: Found {len(google_results)} results")
                for i, result in enumerate(google_results[:3], 1):  # Limit to top 3
                    formatted_results += f"{i}. {result.get('title')}\n"
                    formatted_results += f"   URL: {result.get('url')}\n"
                    formatted_results += f"   {result.get('description')}\n\n"
                    result_count += 1
            else:
                logger.warning(f"⚠️ NO GOOGLE RESULTS: Search yielded no Google results")
            
            # Add results from Bing if Google didn't return anything
            if not google_results:
                bing_results = search_results.get("results", {}).get("bing", [])
                if bing_results:
                    logger.info(f"📊 BING RESULTS: Found {len(bing_results)} results")
                    for i, result in enumerate(bing_results[:3], 1):
                        formatted_results += f"{i}. {result.get('title')}\n"
                        formatted_results += f"   URL: {result.get('url')}\n"
                        formatted_results += f"   {result.get('description')}\n\n"
                        result_count += 1
                else:
                    logger.warning(f"⚠️ NO BING RESULTS: Search yielded no Bing results")
            
            # Add results from DuckDuckGo if neither Google nor Bing returned anything
            if not google_results and not search_results.get("results", {}).get("bing", []):
                ddg_results = search_results.get("results", {}).get("duckduckgo", [])
                if ddg_results:
                    logger.info(f"📊 DUCKDUCKGO RESULTS: Found {len(ddg_results)} results")
                    for i, result in enumerate(ddg_results[:3], 1):
                        formatted_results += f"{i}. {result.get('title')}\n"
                        formatted_results += f"   URL: {result.get('url')}\n"
                        formatted_results += f"   {result.get('description')}\n\n"
                        result_count += 1
                else:
                    logger.warning(f"⚠️ NO DUCKDUCKGO RESULTS: Search yielded no DuckDuckGo results")
            
            # Log search results summary
            if result_count > 0:
                logger.info(f"✅ SEARCH COMPLETE: Found {result_count} results in {search_time:.2f}s")
                # Log the first result title to give a sense of relevance
                first_result = None
                for engine in ["google", "bing", "duckduckgo"]:
                    results = search_results.get("results", {}).get(engine, [])
                    if results:
                        first_result = results[0].get("title")
                        break
                
                if first_result:
                    logger.info(f"📑 TOP RESULT: '{first_result}'")
            else:
                logger.warning(f"⚠️ SEARCH COMPLETE: No results found in {search_time:.2f}s")
                logger.info(f"🧠 FALLBACK TO MODEL KNOWLEDGE: Will use model's built-in knowledge to answer")
                
                # Add a note about using model knowledge to the formatted results
                formatted_results = "\nSearch was performed but no relevant results were found. Using model knowledge to provide an answer.\n"
            
            return formatted_results if len(formatted_results) > 20 else ""
        except Exception as e:
            logger.error(f"❌ SEARCH ERROR: {e}")
            logger.info(f"🧠 FALLBACK TO MODEL KNOWLEDGE: Will use model's built-in knowledge due to search error")
            return "\nAttempted to search but encountered an error. Using built-in knowledge instead.\n"
