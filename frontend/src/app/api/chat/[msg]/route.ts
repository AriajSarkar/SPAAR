import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse } from '@/lib/api-client';

/**
 * API handler for chat messages that forwards requests to the LLM API
 * 
 * @param request The incoming request
 * @param params Contains parameters from the dynamic route segment
 * @returns JSON response from the LLM API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { msg: string } }
) {
  try {
    // In Next.js App Router, params must be properly awaited
    const { msg } = await Promise.resolve(params);
    
    // Get session_id from query parameters if available
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    // Generate response using the LLM API
    try {
      // Convert null to undefined for sessionId to satisfy TypeScript
      const data = await generateLLMResponse(msg, sessionId || undefined);
      return NextResponse.json(data);
    } catch (error: any) {
      throw error;
    }
    
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    
    // Heart-themed error handling with appropriate status codes
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timed out. Your model is still thinking, please try again.',
          errorType: 'timeout'
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred processing your request',
        errorType: 'general' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for more complex chat requests with a message body
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { msg: string } }
) {
  try {
    // In Next.js App Router, params must be properly awaited
    const { msg } = await Promise.resolve(params);
    
    // Get the request body if any
    const body = await request.json().catch(() => ({}));
    
    // Extract session_id and include_history from the request body if available
    const sessionId = body.session_id || undefined; // Change null to undefined
    const includeHistory = body.include_history !== undefined ? body.include_history : true;
    
    // Generate response using the LLM API
    try {
      const data = await generateLLMResponse(msg, sessionId, includeHistory);
      return NextResponse.json(data);
    } catch (error: any) {
      throw error;
    }
    
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    
    // Heart-themed error handling
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timed out. Your model is still thinking, please try again.',
          errorType: 'timeout'
        },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'An error occurred processing your request',
        errorType: 'general'
      },
      { status: 500 }
    );
  }
}