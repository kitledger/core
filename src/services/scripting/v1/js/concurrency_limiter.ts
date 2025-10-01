type SlotResolver = () => void;

let availableSlots: number;
const waitingQueue: SlotResolver[] = [];

export function initializeConcurrency(limit: number) {
    availableSlots = limit;
}

export function acquireSlot(): Promise<void> {
    return new Promise((resolve) => {
        if (availableSlots > 0) {
            availableSlots--;
            resolve();
        } else {
            waitingQueue.push(resolve);
        }
    });
}

export function releaseSlot() {
    if (waitingQueue.length > 0) {
        const nextInLine = waitingQueue.shift()!;
        nextInLine();
    } else {
        availableSlots++;
    }
}