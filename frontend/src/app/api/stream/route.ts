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

                    // Implement retry mechanism
                    let attempts = 0;
                    const maxAttempts = 3;
                    let apiResponse;

                    while (attempts < maxAttempts) {
                        try {
                            apiResponse = await fetch(`${apiUrl}/api/v1/llm/generate/`, {
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

                            // If successful, break the retry loop
                            if (apiResponse.ok) break;

                            // If we get a 5xx error, retry
                            if (apiResponse.status >= 500) {
                                attempts++;
                                // Wait with exponential backoff
                                await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
                                continue;
                            } else {
                                // For 4xx errors, don't retry
                                break;
                            }
                        } catch (error) {
                            // For network errors, retry
                            attempts++;
                            if (attempts >= maxAttempts) throw error;
                            await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
                        }
                    }

                    if (!apiResponse || !apiResponse.ok) {
                        throw new Error(`API error: ${apiResponse?.status || 'Network failure'}`);
                    }

                    // Send a ping comment to prevent buffering and keep the connection alive
                    controller.enqueue(encoder.encode(`: ping\n\n`));

                    // Use setTimeout to avoid buffering issues
                    await new Promise((resolve) => setTimeout(resolve, 0));

                    // Check content type to determine processing approach
                    const contentType = apiResponse.headers.get('content-type') || '';

                    if (contentType.includes('text/event-stream')) {
                        // The backend returns SSE, so pass it through with proper error handling
                        const reader = apiResponse.body?.getReader();
                        if (!reader) {
                            throw new Error('Failed to get reader from response');
                        }

                        try {
                            // Read and pass through the SSE stream
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                // Pass through the raw chunk
                                controller.enqueue(value);
                            }
                        } catch (streamError) {
                            console.error('Error reading stream:', streamError);
                            // Send error as an event
                            controller.enqueue(
                                encoder.encode(
                                    `data: ${JSON.stringify({ error: 'Connection interrupted. Please try again.' })}\n\n`,
                                ),
                            );
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

                                // Simulate streaming with words, with improved chunking logic
                                if (responseText) {
                                    const words = responseText.split(/\s+/);

                                    // Use a more consistent chunking approach
                                    const chunkSize = 3; // Send 3 words at a time for more natural reading

                                    for (let i = 0; i < words.length; i += chunkSize) {
                                        // Get next chunk of words (up to chunkSize)
                                        const wordsChunk = words.slice(i, i + chunkSize);

                                        // Format chunk with proper spacing
                                        const text = wordsChunk.join(' ') + (i + chunkSize < words.length ? ' ' : '');

                                        const chunk = {
                                            candidates: [
                                                {
                                                    content: {
                                                        parts: [{ text }],
                                                        role: 'model',
                                                    },
                                                },
                                            ],
                                        };

                                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

                                        // Add a short delay between chunks for readability
                                        // Use consistent timing for more predictable UX
                                        await new Promise((resolve) => setTimeout(resolve, 30));
                                    }
                                } else {
                                    // Handle empty response case
                                    const emptyChunk = {
                                        candidates: [
                                            {
                                                content: {
                                                    parts: [{ text: 'No response generated. Please try again.' }],
                                                    role: 'model',
                                                },
                                            },
                                        ],
                                    };
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(emptyChunk)}\n\n`));
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
                    // Send error as an event with detailed error information
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error('Streaming error:', errorMessage);
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({
                                error: errorMessage,
                                recoverable: true,
                                timestamp: new Date().toISOString(),
                            })}\n\n`,
                        ),
                    );
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
                'Content-Encoding': 'none', // Prevent compression which can cause buffering issues
                'X-Accel-Buffering': 'no', // Prevents nginx buffering
                'Transfer-Encoding': 'chunked', // Ensure proper chunked transfer
            },
        });
    } catch (error) {
        console.error('Error in stream handler:', error);

        // Return an error response
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
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
