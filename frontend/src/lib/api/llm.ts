/**
 * API service for LLM (Language Learning Model) interactions
 */
import { simulateStreamingResponse } from '../utils/streams';

// Base URL for API - can be configured based on environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * Generate a response from the LLM with streaming support
 * 
 * @param prompt The user's question or request
 * @param sessionId Optional session ID for conversation context
 * @param includeHistory Whether to include conversation history
 * @param onChunk Callback for receiving streaming chunks
 * @returns Promise with the LLM response
 */
export async function generateLLMResponse(
  prompt: string, 
  sessionId?: string,
  includeHistory: boolean = true,
  onChunk?: ((chunk: string) => void) | boolean
): Promise<any> {
  try {
    // Check if onChunk is a function
    const streamCallback = typeof onChunk === 'function' ? onChunk : undefined;
    
    // Always use direct backend endpoint
    const endpoint = `${API_BASE_URL}/api/v1/llm/generate/`;
    
    // Configure headers - don't explicitly request SSE to avoid 406 error
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      // Let the server decide the response format
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt,
        session_id: sessionId,
        include_history: includeHistory
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Check if the response is SSE format
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/event-stream') && streamCallback) {
      // Process as event stream
      let fullResponse = '';
      
      // Create a new event source from the response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader from response');
      }
      
      // Read the stream
      let decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines in the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last potentially incomplete line
        
        for (const line of lines) {
          if (line.trim() === '') continue;
          
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            
            if (data === '[DONE]') {
              // Stream completed
              continue;
            }
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.candidates && 
                  parsedData.candidates[0]?.content?.parts?.[0]) {
                const text = parsedData.candidates[0].content.parts[0].text || '';
                if (text) {
                  fullResponse += text;
                  streamCallback(text);
                }
              }
            } catch (e) {
              console.warn("Error parsing chunk:", e);
            }
          }
        }
      }
      
      // Return the full response
      return { response: fullResponse };
    } else {
      try {
        // Try to parse as JSON first
        const data = await response.json();
        
        // Extract response text
        let responseText = '';
        if (data.response) {
          responseText = data.response;
        } else if (data.candidates && 
                  data.candidates[0]?.content?.parts) {
          responseText = data.candidates[0].content.parts
            .map((part: any) => part.text || '')
            .join('');
        }
        
        // If we have a callback, simulate streaming
        if (streamCallback && responseText) {
          simulateStreamingResponse(responseText, streamCallback);
        }
        
        return { response: responseText, ...data };
      } catch (jsonError) {
        // If JSON parsing fails, try to process as text
        const text = await response.text();
        
        if (streamCallback) {
          simulateStreamingResponse(text, streamCallback);
        }
        
        return { response: text };
      }
    }
  } catch (error) {
    console.error('Error generating LLM response:', error);
    throw error;
  }
}