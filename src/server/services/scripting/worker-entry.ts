import type {
    HostToWorkerMessage,
    WorkerToHostMessage,
} from "@kitledger/actions/runtime";
import type { ExecuteScriptArgs } from "./runtime.js"; // Import types from host

// --- Missing DOM Type Definitions ---

interface MessageEvent<T = any> {
    readonly data: T;
}

type EventListener = (event: MessageEvent) => void;
type EventListenerOrEventListenerObject = EventListener | { handleEvent: EventListener };

// --- NEW: Define Node.js-specific error properties ---
interface NodeError extends Error {
    code?: string;
    permission?: string;
    resource?: string;
}

// --- Extend globalThis type ---
declare global {
    var postMessage: (message: ChildToParentMessage) => void;
    var addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    var removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
    var self: typeof globalThis;
}

// --- IPC Message Types ---
// Must be kept in sync with runtime.ts

type JobStartMessage = {
    type: "JOB_START";
    payload: ExecuteScriptArgs;
};

type ParentToChildMessage = JobStartMessage | HostToWorkerMessage<unknown>;
type ChildToParentMessage = WorkerToHostMessage<unknown>;

// --- Sandbox State ---

let isBusy = false;
const eventListeners = new Map<string, Set<EventListener>>();

// --- Sandbox Environment Emulation ---
// This fakes the 'self' (or 'globalThis') environment
// that the __host_rpc function expects.
globalThis.self = globalThis;

globalThis.postMessage = (message: ChildToParentMessage) => {
    if (!process.send) {
        console.error("Kitledger worker: process.send is not available.");
        return;
    }
    try {
        // We must check for 'error' property on EXECUTION_RESULT
        // as Errors are not cloneable across IPC.
        if (message.type === "EXECUTION_RESULT" && message.payload.error) {
            process.send({
                type: "EXECUTION_RESULT",
                payload: { status: "ERROR", error: message.payload.error },
            });
        } else {
            process.send(message);
        }
    } catch (e) {
        console.error("Kitledger worker: Failed to post message to host.", e);
        const errorMsg = (e as Error).message;
        process.send({
            type: "EXECUTION_RESULT",
            payload: { status: "ERROR", error: `Worker serialization failed: ${errorMsg}` },
        });
    }
};

globalThis.addEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
) => {
    if (type !== "message") return;
    const callback = typeof listener === "function" ? listener : listener.handleEvent;
    if (!callback) return;

    let set = eventListeners.get("message");
    if (!set) {
        set = new Set();
        eventListeners.set("message", set);
    }
    set.add(callback);
};

globalThis.removeEventListener = (
    type: string,
    listener: EventListenerOrEventListenerObject,
) => {
    if (type !== "message") return;
    const set = eventListeners.get("message");
    if (set) {
        const callback = typeof listener === "function" ? listener : listener.handleEvent;
        if (callback) set.delete(callback);
    }
};

// --- Job Runner ---

async function runJob(args: ExecuteScriptArgs) {
    const { code, inputJSON, scriptType, trigger } = args;

    try {
        const dataUrl = `data:text/javascript,${encodeURIComponent(code)}`;
        const module = await import(dataUrl);

        if (!module.default) {
            throw new Error("Script must have a default export.");
        }

        const handler = module.default;
        const input = JSON.parse(inputJSON);

        if (scriptType === "ServerEvent" || scriptType === "EndpointRequest") {
            // Object-based handlers
            if (typeof handler !== "object" || handler === null) {
                throw new Error(`${scriptType} scripts must export an object.`);
            }

            const key = trigger?.toLowerCase();
            if (key && typeof handler[key] === "function") {
                await handler[key](input);
            } else if (scriptType === "EndpointRequest") {
                throw new Error(`Method "${trigger}" not implemented on endpoint.`);
            }
            // For ServerEvent, it's fine if the hook isn't implemented (no-op)
        } else {
            // Function-based handlers (ScheduledTask, QueuedTask)
            if (typeof handler !== "function") {
                throw new Error(`${scriptType} scripts must have a default export function.`);
            }
            await handler(input);
        }

        // --- MODIFIED: Check if an unhandled error already fired ---
        if (!isBusy) {
            // An unhandled rejection already fired, set isBusy = false, and sent the error.
            // Don't send a SUCCESS message.
            return;
        }

        globalThis.postMessage({
            type: "EXECUTION_RESULT",
            payload: { status: "SUCCESS" },
        });
    } catch (error: unknown) {
        // --- MODIFIED: Check if an unhandled error already fired ---
        if (!isBusy) {
            return;
        }

        // --- MODIFIED: Prettier error formatting for permission errors ---
        const err = error as NodeError;
        let errorMsg = err.message;

        if (err.code === "ERR_ACCESS_DENIED") {
            errorMsg = `Security Error: Access denied. Permission '${err.permission}' was not granted.`;
            if (err.resource) {
                errorMsg += ` (Resource: '${err.resource}')`;
            }
        }

        globalThis.postMessage({
            type: "EXECUTION_RESULT",
            payload: { status: "ERROR", error: errorMsg },
        });
    }
}

// --- Main Process Listener ---
// This is the "server" loop of the child process.

process.on("message", (message: ParentToChildMessage) => {
    if (message.type === "JOB_START") {
        if (isBusy) {
            // This should never happen if the pool logic is correct
            console.error("Kitledger worker: Received job while already busy.");
            return;
        }
        isBusy = true;

        // --- NEW: Create a handler for unhandled rejections ---
        const unhandledRejectionHandler = (reason: any, promise: Promise<any>) => {
            if (!isBusy) {
                // Job already finished (or error was already handled), ignore.
                return;
            }
            isBusy = false; // The job is now over.

            let errorMsg = "Unhandled promise rejection: ";
            if (reason instanceof Error) {
                const err = reason as NodeError;
                if (err.code === "ERR_ACCESS_DENIED") {
                    errorMsg = `Security Error: Access denied (unhandled). Permission '${err.permission}' was not granted.`;
                    if (err.resource) {
                        errorMsg += ` (Resource: '${err.resource}')`;
                    }
                } else {
                    errorMsg += err.message;
                }
            } else {
                errorMsg += String(reason);
            }

            globalThis.postMessage({
                type: "EXECUTION_RESULT",
                payload: { status: "ERROR", error: errorMsg },
            });
        };

        // --- NEW: Attach the listener for this job ---
        process.on("unhandledRejection", unhandledRejectionHandler);

        // Run the job, but don't await it here.
        // The `finally` block of runJob will post the result.
        runJob(message.payload).finally(() => {
            // --- NEW: Detach the listener ---
            process.removeListener("unhandledRejection", unhandledRejectionHandler);
            
            // Clean up for the next job
            isBusy = false;
            eventListeners.clear();
        });
    } else if (message.type === "ACTION_RESPONSE") {
        // This is a message for the user script.
        // Fan it out to all 'message' listeners.
        const set = eventListeners.get("message");
        if (set) {
            // Create a fake MessageEvent
            const event = { data: message } as MessageEvent;
            set.forEach((listener) => {
                try {
                    listener(event);
                } catch (e) {
                    console.error("Kitledger worker: Error in user event listener:", e);
                }
            });
        }
    }
});

console.log("Kitledger worker process started and waiting for jobs.");