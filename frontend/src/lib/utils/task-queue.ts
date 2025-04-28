/**
 * Non-blocking task queue system for managing background operations
 * Uses microtasks and setTimeout to avoid blocking the main thread
 */

export type Task = {
    id: string;
    execute: () => Promise<void>;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    retries?: number;
    maxRetries?: number;
    priority?: number;
};

/**
 * Task Queue that uses microtasks to avoid blocking the main thread
 * Ensures UI remains responsive even during heavy operations
 */
class TaskQueue {
    private queue: Task[] = [];
    private isProcessing = false;
    private readonly maxConcurrent: number;
    private activeCount = 0;

    constructor(maxConcurrent = 1) {
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Add a task to the queue and start processing if not already
     * @returns A function to cancel this task if it hasn't started yet
     */
    enqueue(task: Task): () => boolean {
        // Assign default values
        const fullTask: Task = {
            ...task,
            retries: 0,
            maxRetries: task.maxRetries ?? 3,
            priority: task.priority ?? 0,
        };

        this.queue.push(fullTask);

        // Sort by priority (higher numbers first)
        this.queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Use a microtask to start processing without blocking
        if (!this.isProcessing) {
            queueMicrotask(() => this.processQueue());
        }

        // Return function to cancel this task if still in queue
        return () => {
            const index = this.queue.findIndex((t) => t.id === task.id);
            if (index >= 0) {
                this.queue.splice(index, 1);
                return true;
            }
            return false;
        };
    }

    /**
     * Process all tasks in the queue with concurrency control
     * Uses setTimeout to yield to the main thread between tasks
     */
    private processQueue(): void {
        // Exit if no tasks or reached concurrency limit
        if (this.queue.length === 0 || this.activeCount >= this.maxConcurrent) {
            if (this.activeCount === 0) {
                this.isProcessing = false;
            }
            return;
        }

        this.isProcessing = true;
        this.activeCount += 1;

        const task = this.queue.shift();
        if (!task) {
            this.activeCount -= 1;
            queueMicrotask(() => this.processQueue());
            return;
        }

        // Execute the task and handle result
        Promise.resolve()
            .then(() => task.execute())
            .then(() => {
                task.onSuccess?.();
            })
            .catch((error) => {
                console.error(`Task ${task.id} failed:`, error);

                const typedError = error instanceof Error ? error : new Error(String(error));
                task.onError?.(typedError);

                // Retry logic
                if ((task.retries || 0) < (task.maxRetries || 3)) {
                    this.queue.push({
                        ...task,
                        retries: (task.retries || 0) + 1,
                    });
                }
            })
            .finally(() => {
                this.activeCount -= 1;

                // Use setTimeout to yield to the main thread before processing next task
                // This prevents long-running synchronous operations from blocking the UI
                setTimeout(() => this.processQueue(), 0);
            });

        // Process next task in parallel if concurrency allows
        if (this.activeCount < this.maxConcurrent) {
            queueMicrotask(() => this.processQueue());
        }
    }

    /**
     * Clear all pending tasks from the queue
     */
    clear(): number {
        const count = this.queue.length;
        this.queue = [];
        return count;
    }
}

// Singleton instance to be used throughout the app
export const taskQueue = new TaskQueue();

/**
 * Helper to enqueue a named task
 */
export function enqueueTask(
    id: string,
    execute: () => Promise<void>,
    options?: {
        onSuccess?: () => void;
        onError?: (error: Error) => void;
        maxRetries?: number;
        priority?: number;
    },
): () => boolean {
    return taskQueue.enqueue({
        id,
        execute,
        ...options,
    });
}
