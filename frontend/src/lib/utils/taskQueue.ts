/**
 * Task queue system for managing background operations
 * Ensures API calls are handled efficiently without blocking the UI
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

class TaskQueue {
    private queue: Task[] = [];
    private isProcessing = false;
    private readonly maxConcurrent: number;
    private activeCount = 0;
    private onTaskComplete?: (task: Task, error?: Error) => void;

    constructor(maxConcurrent = 2) {
        this.maxConcurrent = maxConcurrent;
    }

    /**
     * Set a callback to be notified when any task completes
     */
    setCompletionCallback(callback: (task: Task, error?: Error) => void) {
        this.onTaskComplete = callback;
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

        if (!this.isProcessing) {
            this.processQueue();
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
     */
    private async processQueue(): Promise<void> {
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
            this.processQueue();
            return;
        }

        try {
            await task.execute();
            task.onSuccess?.();
            this.onTaskComplete?.(task);
        } catch (error) {
            console.error(`Task ${task.id} failed:`, error);

            const typedError = error instanceof Error ? error : new Error(String(error));
            task.onError?.(typedError);
            this.onTaskComplete?.(task, typedError);

            // Retry logic
            if ((task.retries || 0) < (task.maxRetries || 3)) {
                this.queue.push({
                    ...task,
                    retries: (task.retries || 0) + 1,
                });
            }
        } finally {
            this.activeCount -= 1;
            this.processQueue();
        }

        // Process next task in parallel if possible
        if (this.activeCount < this.maxConcurrent) {
            this.processQueue();
        }
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
