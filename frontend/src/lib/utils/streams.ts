/**
 * Utility functions for handling streaming responses
 */

/**
 * Simulates streaming response by chunking text and using setTimeout
 * Enhanced with more natural-feeling chunking and consistent timing
 *
 * @param text The full text to stream in chunks
 * @param onChunk Callback function that receives each chunk
 */
export function simulateStreamingResponse(text: string, onChunk: (chunk: string) => void): () => void {
    // Split response into words
    const words = text.split(/\s+/);
    let currentIndex = 0;

    // Use a constant chunk size for more consistent UX
    const chunkSize = 3; // Send 3 words at a time for more natural reading

    // Handle special case of empty text
    if (words.length === 0 || (words.length === 1 && words[0] === '')) {
        onChunk('');
        return () => {};
    }

    // Track if we've been canceled
    let isCanceled = false;

    // Function to process chunks with consistent timing
    function processNextChunk() {
        if (isCanceled || currentIndex >= words.length) return;

        // Get next chunk of words (up to chunkSize)
        const wordsToSend = Math.min(chunkSize, words.length - currentIndex);
        const chunk =
            words.slice(currentIndex, currentIndex + wordsToSend).join(' ') +
            (currentIndex + wordsToSend < words.length ? ' ' : '');

        currentIndex += wordsToSend;

        try {
            // Send the chunk
            onChunk(chunk);
        } catch (error) {
            console.error('Error in streaming callback:', error);
            // Mark as canceled to stop further processing
            isCanceled = true;
            return;
        }

        // Use consistent timing between chunks for more natural reading
        // The delay is proportional to the number of words to simulate natural reading
        const wordsPerSecond = 6; // Approximate reading speed
        const delay = (wordsToSend / wordsPerSecond) * 1000;

        if (currentIndex < words.length) {
            setTimeout(processNextChunk, delay);
        }
    }

    // Start the streaming simulation
    processNextChunk();

    // Return a cleanup function in case we need to cancel the streaming
    return () => {
        isCanceled = true;
    };
}
