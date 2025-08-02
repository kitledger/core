/**
 * Need to statically import the worker file in order
 * for it to work with Deno compile.
 */
import "./worker.ts";
import { workerConfig } from "../../config.ts";

type Task = {
	id: string;
	task: string;
	payload: unknown;
	resolve: (value: unknown) => void;
	reject: (reason: Error) => void;
	timeoutId?: number;
	workerId?: string;
};

type WorkerState = {
	id: string;
	instance: Worker;
	isIdle: boolean;
};

type WorkerMessage = {
	id: string;
	status: "success" | "error";
	data: unknown;
};

class WorkerPool {
	private workers: WorkerState[] = [];
	private taskQueue: Task[] = [];
	private activeTasks = new Map<string, Task>();
	private isClosing = false;
	private readonly options: typeof workerConfig;

	constructor(private workerPath: string) {
		this.options = workerConfig;
		for (let i = 0; i < this.options.poolSize; i++) {
			this.addNewWorker();
		}
	}

	private addNewWorker(): void {
		const workerId = crypto.randomUUID();
		const workerInstance = new Worker(new URL(this.workerPath, import.meta.url).href, {
			type: "module",
		});

		const workerState: WorkerState = {
			id: workerId,
			instance: workerInstance,
			isIdle: true,
		};

		workerInstance.onmessage = (e: MessageEvent<WorkerMessage>) => {
			this.onWorkerMessage(workerState, e.data);
		};

		workerInstance.onerror = (e) => {
			this.onWorkerError(workerState, new Error(e.message));
		};

		this.workers.push(workerState);
	}

	public runTask(task: string, payload: unknown): Promise<unknown> {
		if (this.isClosing) {
			return Promise.reject(new Error("Pool is closing. No new tasks accepted."));
		}
		if (this.taskQueue.length >= this.options.maxQueueSize) {
			return Promise.reject(new Error("Task queue is full."));
		}

		return new Promise((resolve, reject) => {
			const id = crypto.randomUUID();
			const newTask: Task = { id, task, payload, resolve, reject };
			this.dispatch(newTask);
		});
	}

	private dispatch(task: Task): void {
		const idleWorker = this.workers.find((w) => w.isIdle);
		if (idleWorker) {
			this.runOnWorker(task, idleWorker);
		} else {
			this.taskQueue.push(task);
		}
	}

	private runOnWorker(task: Task, worker: WorkerState): void {
		worker.isIdle = false;

		const timeoutId = setTimeout(() => {
			const timeoutError = new Error(`Task '${task.task}' timed out after ${this.options.taskTimeout}ms`);
			this.onWorkerError(worker, timeoutError);
		}, this.options.taskTimeout);

		const activeTask: Task = { ...task, timeoutId, workerId: worker.id };
		this.activeTasks.set(task.id, activeTask);

		worker.instance.postMessage({
			id: task.id,
			task: task.task,
			payload: task.payload,
		});
	}

	private onWorkerMessage(worker: WorkerState, message: WorkerMessage): void {
		const task = this.activeTasks.get(message.id);
		if (!task) return;

		if (task.timeoutId) clearTimeout(task.timeoutId);

		if (message.status === "success") {
			task.resolve(message.data);
		} else {
			task.reject(new Error(message.data as string));
		}

		this.activeTasks.delete(task.id);
		worker.isIdle = true;
		this.checkQueue();
	}

	private onWorkerError(worker: WorkerState, error: Error): void {
		console.error(`Worker ${worker.id} encountered an error:`, error.message);
		const task = [...this.activeTasks.values()].find((t) => t.workerId === worker.id);

		if (task) {
			if (task.timeoutId) clearTimeout(task.timeoutId);
			task.reject(error);
			this.activeTasks.delete(task.id);
		}

		this.replaceWorker(worker);
	}

	private replaceWorker(crashedWorker: WorkerState): void {
		crashedWorker.instance.terminate();
		this.workers = this.workers.filter((w) => w.id !== crashedWorker.id);
		if (!this.isClosing) {
			this.addNewWorker();
			this.checkQueue();
		}
	}

	private checkQueue(): void {
		if (this.isClosing || this.taskQueue.length === 0) return;
		const idleWorker = this.workers.find((w) => w.isIdle);
		if (idleWorker) {
			const nextTask = this.taskQueue.shift()!;
			this.runOnWorker(nextTask, idleWorker);
		}
	}

	public close(): Promise<void> {
		this.isClosing = true;

		return new Promise((resolve) => {
			const check = () => {
				if (this.activeTasks.size === 0 && this.taskQueue.length === 0) {
					this.workers.forEach((w) => w.instance.terminate());
					this.workers = [];
					resolve();
				} else {
					setTimeout(check, 100);
				}
			};
			check();
		});
	}

	public terminate(): void {
		this.isClosing = true;
		const error = new Error("Pool was terminated abruptly.");

		this.taskQueue.forEach((task) => task.reject(error));
		this.taskQueue = [];

		this.activeTasks.forEach((task) => {
			if (task.timeoutId) clearTimeout(task.timeoutId);
			task.reject(error);
		});
		this.activeTasks.clear();

		this.workers.forEach((w) => w.instance.terminate());
		this.workers = [];
	}
}

export const workerPool = new WorkerPool(
	new URL("./worker.ts", import.meta.url).pathname,
);
