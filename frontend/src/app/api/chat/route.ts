import { NextRequest, NextResponse } from 'next/server';
import { generateLLMResponse, getConversationHistory } from '@/lib/api-client';

/**
 * API handler for chat messages that forwards requests to the LLM API
 */
export async function GET(request: NextRequest) {
  try {
    // Get message and session_id from query parameters
    const url = new URL(request.url);
    const msg = url.searchParams.get('msg');
    const sessionId = url.searchParams.get('session_id');
    
    if (!msg) {
      return NextResponse.json(
        { error: 'Message parameter is required' },
        { status: 400 }
      );
    }
    
    // If session_id is provided, get conversation history
    if (sessionId) {
      try {
        const history = await getConversationHistory(sessionId);
        return NextResponse.json(history);
      } catch (error: unknown) {
        return NextResponse.json(
          { 
            error: error instanceof Error ? error.message : 'Failed to get conversation history',
            errorType: 'history' 
          },
          { status: 500 }
        );
      }
    }
    
    // Otherwise, generate a response to the message
    try {
      const data = await generateLLMResponse(msg);
      return NextResponse.json(data);
    } catch (error: unknown) {
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Failed to generate response',
          errorType: 'general' 
        },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('Error in chat API route:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred processing your request',
        errorType: 'general' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for more complex chat requests with a message body
 * Now with streaming support
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json().catch(() => null);
    
    if (!body || !body.prompt) {
      return NextResponse.json(
        { error: 'Prompt parameter is required in the request body' },
        { status: 400 }
      );
    }
    
    // Extract parameters from the request body
    const { prompt, session_id, include_history = true, stream = false } = body;
    
    // Check if streaming is requested
    if (stream) {
      const encoder = new TextEncoder();
      
      // Create a stream
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Make the request to the LLM API with a custom handler
            await generateLLMResponse(
              prompt, 
              session_id, 
              include_history,
              (chunk) => {
                // Write each chunk to the stream with SSE format
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
              }
            );
            
            // Signal completion
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
            controller.close();
          } catch (error) {
            // Handle errors during streaming
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' })}\n\n`));
            controller.close();
          }
        }
      });
      
      // Return the streaming response
      return new NextResponse(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }
    
    // Non-streaming response (regular JSON)
    try {
      const data = await generateLLMResponse(prompt, session_id, include_history);
      return NextResponse.json(data);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
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
          error: error instanceof Error ? error.message : 'Failed to generate response',
          errorType: 'general' 
        },
        { status: 500 }
      );
    }
    
  } catch (error: unknown) {
    console.error('Error in chat API route:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'An error occurred processing your request',
        errorType: 'general'
      },
      { status: 500 }
    );
  }
}