/**
 * API Worker for Heart Chat
 * 
 * This file is designed to be loaded both as a regular script 
 * and as a Web Worker. The conditional logic prevents errors
 * when loaded in either context.
 */

// Check if we're in a worker context
const isWorkerContext = typeof self !== 'undefined' && typeof self.importScripts === 'function';

// Only set up worker functionality if in a worker context
if (isWorkerContext) {
  self.addEventListener('message', async function(e) {
    const { id, url, method, body, headers } = e.data;
    
    try {
      // Make the API request
      const response = await fetch(url, {
        method: method || 'GET',
        headers: headers || {
          'Content-Type': 'application/json'
        },
        ...(body && { body: JSON.stringify(body) })
      });
      
      // Parse the response
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        result = await response.text();
      }
      
      // Return the result to the main thread
      self.postMessage({
        id,
        success: response.ok,
        status: response.status,
        data: result,
      });
    } catch (error) {
      // Handle errors
      self.postMessage({
        id,
        success: false,
        error: error.message
      });
    }
  });

  // Notify that the worker is ready
  if (typeof self.postMessage === 'function') {
    self.postMessage({ ready: true });
  }
}

// If loaded as a regular script, provide a no-op implementation
// This prevents errors when the file is loaded directly in a script tag
if (!isWorkerContext && typeof window !== 'undefined') {
  // Create a dummy API to prevent errors
  window.apiWorker = {
    postMessage: () => console.warn('api-worker.js loaded as script, not as Web Worker'),
    onmessage: null
  };
}