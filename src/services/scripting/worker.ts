import type { HostToWorkerMessage, WorkerToHostMessage } from "./shared.ts";

self.onmessage = async (
	event: MessageEvent<{
		code: string;
		context: string;
	}>,
) => {
	const port = event.ports[0];
	if (!port) {
		self.close();
		return;
	}

	port.start();

	const { code, context } = event.data;

	const listeners = new Map<string, Set<EventListener>>();

	self.postMessage = (message: WorkerToHostMessage) => {
		try {
			port.postMessage(message);
		} catch (e) {
			console.error("Kitledger worker: Failed to post message to host.", e);
		}
	};

	self.addEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
		if (type !== "message") {
			return;
		}
		const callback = typeof listener === "function" ? listener : listener.handleEvent;
		if (!callback) return;
		let set = listeners.get("message");
		if (!set) {
			set = new Set();
			listeners.set("message", set);
		}
		set.add(callback);
	};

	self.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject) => {
		if (type !== "message") return;
		const set = listeners.get("message");
		if (set) {
			const callback = typeof listener === "function" ? listener : listener.handleEvent;
			if (callback) {
				set.delete(callback);
			}
		}
	};

	port.onmessage = (event: MessageEvent<HostToWorkerMessage>) => {
		const set = listeners.get("message");
		if (set) {
			set.forEach((listener) => {
				try {
					listener(event);
				} catch (e) {
					console.error("Kitledger worker: Error in user event listener:", e);
				}
			});
		}
	};

	try {
		const scriptFn = new Function("context", `(async () => { ${code} })();`);
		await scriptFn(JSON.parse(context));

		port.postMessage({ type: "executionResult", payload: { status: "success" } });
	} catch (error: unknown) {
		port.postMessage({
			type: "executionResult",
			payload: { status: "error", error: (error as Error).message },
		});
	} finally {
		port.close();
		self.close();
	}
};