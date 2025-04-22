"""
Utilities for token counting that match Google's Gemini API tokenization.
"""
import re

def estimate_tokens(text: str) -> int:
    """
    Estimate token count for text using Google's Gemini guideline:
    "For Gemini models, a token is equivalent to about 4 characters."
    
    This is just an approximation - the actual tokenization is more complex.
    
    Args:
        text: The text to estimate tokens for
        
    Returns:
        Estimated token count
    """
    if not text:
        return 0
        
    # Clean the text of extra whitespace that might affect counting
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Google says 1 token ≈ 4 characters
    return len(text) // 4
    
def estimate_prompt_tokens(prompt: str) -> int:
    """
    A more accurate estimation for specific types of prompts.
    
    Args:
        prompt: The prompt to estimate tokens for
        
    Returns:
        Estimated token count
    """
    # Short English prompts are typically less than 4 chars per token
    # Example: "who r u?" is 3 tokens but only 7 characters
    if len(prompt) <= 20:
        return max(len(prompt.split()), len(prompt) // 3)
    
    return estimate_tokens(prompt)
