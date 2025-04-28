/**
 * Utility functions for handling streaming responses
 */

/**
 * Simulates streaming response by chunking text and using setTimeout
 *
 * @param text The full text to stream in chunks
 * @param onChunk Callback function that receives each chunk
 */
export function simulateStreamingResponse(text: string, onChunk: (chunk: string) => void): void {
    // Split response into words or smaller chunks
    const words = text.split(/\s+/);
    let currentIndex = 0;

    // Use a function that processes chunks with setTimeout
    function processNextChunk() {
        if (currentIndex >= words.length) return;

        // Determine how many words to send in this chunk (random between 1-5)
        const wordsToSend = Math.min(Math.floor(Math.random() * 5) + 1, words.length - currentIndex);

        // Create the chunk
        const chunk = words.slice(currentIndex, currentIndex + wordsToSend).join(' ') + ' ';
        currentIndex += wordsToSend;

        // Send the chunk
        onChunk(chunk);

        // Schedule the next chunk with a small random delay
        if (currentIndex < words.length) {
            setTimeout(processNextChunk, Math.random() * 50 + 10);
        }
    }

    // Start the streaming simulation
    processNextChunk();
}
