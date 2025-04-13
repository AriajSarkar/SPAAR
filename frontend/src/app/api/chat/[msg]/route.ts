import { NextRequest, NextResponse } from 'next/server';

/**
 * API handler for chat messages that forwards requests to n8n webhook
 * Uses heart-themed project guidelines with clean error handling
 * 
 * @param request The incoming request
 * @param params Contains parameters from the dynamic route segment
 * @returns JSON response from the n8n webhook
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { msg: string } }
) {
  try {
    // In Next.js App Router, params must be properly awaited
    const { msg } = await Promise.resolve(params);
    
    // Get the webhook URL from environment variables
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'N8N webhook URL not configured' },
        { status: 500 }
      );
    }
    
    // Format exactly like your working Postman configuration
    // Using path parameter instead of query parameter
    const url = `${webhookUrl}/${encodeURIComponent(msg)}`;
    
    console.log('Calling webhook URL:', url);
    
    // Forward the request directly to the n8n webhook with increased timeout
    // Extending to 30 seconds to accommodate slower backend processing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
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
    
    // Get the webhook URL from environment variables
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'N8N webhook URL not configured' },
        { status: 500 }
      );
    }
    
    // Format exactly like your working Postman configuration
    // Using path parameter instead of query parameter
    const url = `${webhookUrl}/${encodeURIComponent(msg)}`;
    
    console.log('Calling webhook URL (POST):', url);
    
    // Forward the request with increased timeout
    // Extending to 30 seconds to accommodate slower backend processing
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const response = await fetch(url, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      throw fetchError;
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