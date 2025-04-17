import { NextRequest, NextResponse } from 'next/server';

/**
 * API handler for chat messages that forwards requests to n8n webhook
 * Uses query parameters instead of path parameters to avoid Next.js type issues
 */
export async function GET(request: NextRequest) {
  try {
    // Get message from query parameter
    const url = new URL(request.url);
    const msg = url.searchParams.get('msg');
    
    if (!msg) {
      return NextResponse.json(
        { error: 'Message parameter is required' },
        { status: 400 }
      );
    }
    
    // Get the webhook URL from environment variables
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'N8N webhook URL not configured' },
        { status: 500 }
      );
    }
    
    // Format the URL with the message parameter
    const apiUrl = `${webhookUrl}/${encodeURIComponent(msg)}`;
    
    console.log('Calling webhook URL:', apiUrl);
    
    // Forward the request with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(apiUrl, { 
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error: unknown) {
    console.error('Error in chat API route:', error);
    
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
        error: error instanceof Error ? error.message : 'An error occurred processing your request',
        errorType: 'general' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for more complex chat requests with a message body
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json().catch(() => null);
    
    if (!body || !body.msg) {
      return NextResponse.json(
        { error: 'Message parameter is required in the request body' },
        { status: 400 }
      );
    }
    
    const msg = body.msg;
    
    // Get the webhook URL from environment variables
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'N8N webhook URL not configured' },
        { status: 500 }
      );
    }
    
    // Format the URL with the message parameter
    const apiUrl = `${webhookUrl}/${encodeURIComponent(msg)}`;
    
    console.log('Calling webhook URL (POST):', apiUrl);
    
    // Forward the request with timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const response = await fetch(apiUrl, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
    
  } catch (error: unknown) {
    console.error('Error in chat API route:', error);
    
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
        error: error instanceof Error ? error.message : 'An error occurred processing your request',
        errorType: 'general'
      },
      { status: 500 }
    );
  }
}