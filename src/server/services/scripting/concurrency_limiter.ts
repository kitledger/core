import { ChildProcess, fork } from "node:child_process";
import { fileURLToPath } from "node:url";
import { workerConfig } from "../../config.js"; // Assuming config path is correct

// Resolve the path to the worker entry script.
// This assumes your build process (e.g., tsc) outputs a .js file
// alongside this file.
const workerScriptPath = fileURLToPath(
    new URL("./worker-entry.js", import.meta.url)
);

// --- Pool Configuration ---

/** A child process from the pool, with metadata. */
export type PooledWorker = {
    worker: ChildProcess;
    jobsDone: number;
};

const POOL_CONFIG = {
    min: workerConfig.poolSize,
    max: workerConfig.poolSize * 2,
    recycleAfterJobs: 100,
};

const idleWorkers: PooledWorker[] = [];
const waitingTasks: ((worker: PooledWorker) => void)[] = [];
let currentPoolSize = 0;

// --- Private Functions ---

/** Creates a new, sandboxed child process and adds it to the pool. */
function createWorker(): PooledWorker {
    currentPoolSize++;

    const child = fork(workerScriptPath, [], {
        // --- THIS IS THE SANDBOX ---
        execArgv: [
            "--permission", // Enable the permission model (denies all)
        ],
        env: {}, // Start with a clean, empty environment
        stdio: ["ignore", "ignore", "ignore", "ipc"], // Only allow IPC communication
    });

    // Handle unexpected exits
    child.on("exit", (code, signal) => {
        if (code !== 0 && signal !== "SIGTERM") {
            console.error(`Worker process exited unexpectedly. Code: ${code}, Signal: ${signal}`);
            // We'll let recycleWorker handle replacement
            // if it's called by a job that fails.
            // If it exits while idle, it's harder to track.
            // For now, we'll just log it. If it was in the idle
            // pool, it will fail on next acquisition.
            currentPoolSize--;
        }
    });

    return {
        worker: child,
        jobsDone: 0,
    };
}

/**
 * Safely terminates a worker and starts a new one to
 * maintain the pool's 'min' size.
 */
function recycleWorker(reason: string) {
    console.log(`Recycling worker: ${reason}`);
    currentPoolSize--;
    
    // Immediately create a new one to replace it
    // and add it to the pool.
    const newWorker = createWorker();
    releaseWorker(newWorker);
}

// --- Public API ---

/**
 * Starts the worker pool with the minimum number of workers.
 */
export function initializePool() {
    for (let i = 0; i < POOL_CONFIG.min; i++) {
        idleWorkers.push(createWorker());
    }
}

/**
 * Resolves with an available worker from the pool.
 */
export function acquireWorker(): Promise<PooledWorker> {
    return new Promise((resolve) => {
        // 1. If a worker is idle, use it
        if (idleWorkers.length > 0) {
            const pooledWorker = idleWorkers.shift()!;
            resolve(pooledWorker);
            return;
        }

        // 2. If no workers are idle but we're not at max, create a new one
        if (currentPoolSize < POOL_CONFIG.max) {
            const pooledWorker = createWorker();
            resolve(pooledWorker);
            return;
        }

        // 3. If at max capacity, wait in the queue
        waitingTasks.push(resolve);
    });
}

/**
 * Releases a worker back into the pool.
 * @param pooledWorker The worker to release.
 * @param isDirty If true, the worker is compromised (e.g., timed out) and must be terminated.
 */
export function releaseWorker(pooledWorker: PooledWorker, isDirty = false) {
    // 1. If worker is dirty (e.g., timed out), kill it.
    if (isDirty) {
        pooledWorker.worker.kill("SIGTERM");
        recycleWorker("Worker timed out or was dirty.");
        return;
    }
    
    // 2. If worker has done too many jobs, kill it.
    if (pooledWorker.jobsDone >= POOL_CONFIG.recycleAfterJobs) {
        pooledWorker.worker.kill("SIGTERM");
        recycleWorker(`Worker hit job limit (${POOL_CONFIG.recycleAfterJobs})`);
        return;
    }

    // 3. If someone is waiting, give them this worker immediately
    if (waitingTasks.length > 0) {
        const nextTask = waitingTasks.shift()!;
        nextTask(pooledWorker);
        return;
    }

    // 4. If no one is waiting, put it back in the idle queue
    idleWorkers.push(pooledWorker);
}

export function terminatePool() {
    console.log(`Terminating ${idleWorkers.length} idle workers...`);
    while (idleWorkers.length > 0) {
        const pooledWorker = idleWorkers.shift()!;
        pooledWorker.worker.kill("SIGTERM");
        currentPoolSize--;
    }
    // Clear any pending tasks that will never be fulfilled
    waitingTasks.length = 0; 
}