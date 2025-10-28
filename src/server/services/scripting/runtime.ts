import { acquireWorker, initializePool, releaseWorker } from "./concurrency_limiter.js";
import type {
    ExecutionResultPayload,
    HostToWorkerMessage,
    Method,
    WorkerToHostMessage,
    ActionResponsePayload,
} from "@kitledger/actions/runtime";

// --- API Implementation ---

const apiMethodMap: Record<Method, (payload: unknown) => unknown> = {
    "UNIT_MODEL.CREATE": (payload: unknown) => {
        console.log("[User Script | API]: UNIT_MODEL.CREATE called with:", payload);
        return { id: `um_${crypto.randomUUID()}`, status: "created" };
    },
};

function getApiMethod(methodName: Method): (payload: unknown) => unknown {
    const method = apiMethodMap[methodName];
    if (!method) {
        throw new Error(`Unknown API method: ${methodName}`);
    }
    return method;
}

async function invokeApiMethod(methodName: Method, payload: unknown): Promise<unknown> {
    const method = getApiMethod(methodName);
    return await method(payload);
}

// --- Pool Initialization ---

initializePool();

// --- Timeout Helper ---

function timeout(
    ms: number,
    terminatedFlag: { value: boolean },
): { promise: Promise<never>; timeoutId: number } {
    let timeoutId;
    const promise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            terminatedFlag.value = true;
            reject(new Error(`Script execution timed out after ${ms}ms`));
        }, ms);
    });
    return { promise, timeoutId: timeoutId! };
}

/**
 * Arguments for executing a Kit Action Script.
 */
export interface ExecuteScriptArgs {
    code: string;
    inputJSON: string;
    scriptType: string;
    trigger?: string;
    timeoutMs: number;
}

// --- IPC Message Types for Job Management ---
// These wrap the existing @kitledger/actions types

type JobStartMessage = {
    type: "JOB_START";
    payload: ExecuteScriptArgs;
};

// Host-to-Worker can be a Job Start or an Action Response
type ParentToChildMessage = JobStartMessage | HostToWorkerMessage<unknown>;

// Worker-to-Host is just the existing type
type ChildToParentMessage = WorkerToHostMessage<unknown>;

// --- Script Execution ---

export async function executeScript(args: ExecuteScriptArgs): Promise<ExecutionResultPayload> {
    const pooledWorker = await acquireWorker();
    const worker = pooledWorker.worker;
    pooledWorker.jobsDone++;

    const terminatedFlag = { value: false };
    let timeoutId: number | undefined;

    // We must define this handler *before* the promise
    // so it can be referenced in the finally block.
	let onMessage: ((message: ChildToParentMessage) => void) | undefined;
    let onError: ((err: Error) => void) | undefined;

    try {
        const executionPromise = new Promise<ExecutionResultPayload>((resolve, reject) => {
            
            onMessage = async (message: ChildToParentMessage) => {
                if (terminatedFlag.value) return;

                switch (message.type) {
                    case "ACTION_REQUEST": {
                        try {
                            const result = await invokeApiMethod(message.payload.method, message.payload.payload);
                            
                            const response: HostToWorkerMessage<unknown> = {
                                type: "ACTION_RESPONSE",
                                payload: { id: message.payload.id, result },
                            };
                            worker.send(response);
                        }
                        catch (e) {
                             const response: HostToWorkerMessage<unknown> = {
                                type: "ACTION_RESPONSE",
                                payload: { id: message.payload.id, error: (e as Error).message },
                            };
                            worker.send(response);
                        }
                        break;
                    }
                    case "EXECUTION_RESULT": {
                        if (message.payload.status === "SUCCESS") {
                            resolve(message.payload);
                        } else {
                            reject(new Error(message.payload.error ?? "Unknown execution error"));
                        }
                        break;
                    }
                }
            };
            
            const onError = (err: Error) => {
                if (!terminatedFlag.value) {
                    reject(new Error(`Child process error: ${err.message}`));
                }
            };
            
            // Attach listeners for this job
            worker.on("message", onMessage);
            worker.once("error", onError);
            
            // Start the job
            const jobMessage: JobStartMessage = {
                type: "JOB_START",
                payload: args,
            };
            worker.send(jobMessage);
        });

        const { promise: timeoutPromise, timeoutId: id } = timeout(
            args.timeoutMs,
            terminatedFlag,
        );
        timeoutId = id;

        return await Promise.race([
            executionPromise,
            timeoutPromise,
        ]);
    }
    finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        
        // --- CRITICAL CLEANUP ---
        // Remove this job's listener so the worker is clean
        // for the next job in the pool.
        if (onMessage) {
            worker.removeListener("message", onMessage);
        }
        
        releaseWorker(pooledWorker, terminatedFlag.value);
    }
}