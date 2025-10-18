type SlotResolver = () => void;

let availableSlots: number;
const waitingQueue: SlotResolver[] = [];

/**
 * Starts the concurrency limiter with a specified limit that comes from the config module.
 * @param limit The maximum number of concurrent operations allowed.
 */
export function initializeConcurrency(limit: number) {
	availableSlots = limit;
}

/**
 * Resolves when a slot is available for use. If no slots are available, it waits until one is released.
 * @returns A promise that resolves when a slot is acquired.
 */
export function acquireSlot(): Promise<void> {
	return new Promise((resolve) => {
		if (availableSlots > 0) {
			availableSlots--;
			resolve();
		}
		else {
			waitingQueue.push(resolve);
		}
	});
}

/**
 * Releases a previously acquired slot, allowing another waiting operation to proceed if any are queued.
 */
export function releaseSlot() {
	if (waitingQueue.length > 0) {
		const nextInLine = waitingQueue.shift()!;
		nextInLine();
	}
	else {
		availableSlots++;
	}
}
