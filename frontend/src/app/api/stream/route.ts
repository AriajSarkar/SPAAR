import { NextRequest } from 'next/server';

// Enable streaming responses
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure we're using Node.js runtime for better streaming support

/**
 * Proxy API handler that converts regular JSON responses to SSE format
 * or passes through existing SSE responses
 */
export async function POST(request: NextRequest) {
    try {
        // Parse the request body
        const body = await request.json();
        const { prompt, sessionId, includeHistory } = body;

        // Create a stream for SSE response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Indirect backend call via proxy
                    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
                    const apiResponse = await fetch(`${apiUrl}/api/v1/llm/generate/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'text/event-stream',
                        },
                        body: JSON.stringify({
                            prompt,
                            session_id: sessionId,
                            include_history: includeHistory,
                        }),
                    });

                    // Check if the response is OK
                    if (!apiResponse.ok) {
                        throw new Error(`API error: ${apiResponse.status}`);
                    }

                    // Send a comment line first to prevent buffering
                    controller.enqueue(encoder.encode(`: ping\n\n`));

                    // Use setTimeout to avoid buffering issues
                    await new Promise((resolve) => setTimeout(resolve, 0));

                    // Check content type to determine processing approach
                    const contentType = apiResponse.headers.get('content-type') || '';

                    if (contentType.includes('text/event-stream')) {
                        // The backend already returns SSE, so we'll pass it through
                        const reader = apiResponse.body?.getReader();
                        if (!reader) {
                            throw new Error('Failed to get reader from response');
                        }

                        // Read and pass through the SSE stream
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;

                            // Pass through the raw chunk
                            controller.enqueue(value);
                        }
                    } else {
                        // The backend returns JSON, convert to SSE format
                        const data = await apiResponse.text();

                        try {
                            // Check if it's already an SSE format (begins with data:)
                            if (data.trim().startsWith('data:')) {
                                // It's already SSE format, pass it through line by line
                                const lines = data.split('\n');
                                for (const line of lines) {
                                    if (line.trim()) {
                                        controller.enqueue(encoder.encode(line + '\n\n'));
                                    }
                                }
                            } else {
                                // Parse as JSON and convert to SSE
                                const jsonData = JSON.parse(data);

                                // Extract response text
                                let responseText = '';
                                if (jsonData.response) {
                                    responseText = jsonData.response;
                                } else if (jsonData.candidates && jsonData.candidates[0]?.content?.parts?.[0]) {
                                    responseText = jsonData.candidates[0].content.parts[0].text || '';
                                }

                                // Simulate streaming with words
                                const words = responseText.split(/\s+/);

                                for (let i = 0; i < words.length; i++) {
                                    const chunk = {
                                        candidates: [
                                            {
                                                content: {
                                                    parts: [{ text: words[i] + (i < words.length - 1 ? ' ' : '') }],
                                                    role: 'model',
                                                },
                                            },
                                        ],
                                    };

                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                                    await new Promise((resolve) => setTimeout(resolve, Math.random() * 40 + 5));
                                }
                            }
                        } catch (e) {
                            console.warn('Error processing response data:', e);
                            // If parsing fails, send the raw data as a single chunk
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: data })}\n\n`));
                        }
                    }

                    // Send the done signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                } catch (error) {
                    // Send error as an event
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
                } finally {
                    // Close the stream
                    controller.close();
                }
            },
        });

        // Return the streaming response with proper headers to prevent buffering
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'Content-Encoding': 'none', // Prevent compression as mentioned in the discussion
                'X-Accel-Buffering': 'no', // Prevents nginx buffering
            },
        });
    } catch (error) {
        console.error('Error in stream handler:', error);

        // Return an error response
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}
