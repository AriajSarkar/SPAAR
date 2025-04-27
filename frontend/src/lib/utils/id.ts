/**
 * Utility functions for generating secure unique IDs
 */

/**
 * Generate a new session ID using cryptographically secure random values
 * Uses the Web Crypto API for secure random number generation
 * 
 * @returns A cryptographically secure unique session ID string in UUID format
 */
export function generateSessionId(): string {
  // Create a typed array of 16 bytes (128 bits)
  const array = new Uint8Array(16);
  
  // Fill the array with cryptographically secure random values
  crypto.getRandomValues(array);
  
  // Set the version bits for UUID v4
  array[6] = (array[6] & 0x0f) | 0x40;  // Version 4
  array[8] = (array[8] & 0x3f) | 0x80;  // Variant 1
  
  // Convert the array to a UUID string format
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}