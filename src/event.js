export class EventDispatcher {
	#waitFunc;
	#scheduled = false;
	#data = {};
	#eventTypes = {};

	constructor(waitFunc) {
		this.#waitFunc = waitFunc;
	}

	registerEvent(eventName, collectFunc) {
		if (this.#eventTypes[eventName]) {
			throw new Error('Event type already registered');
		}
		this.#eventTypes[eventName] = {
			collectFunc,
			handlers: new Set()
		};
	}

	subscribe(eventNames, handler) {
		for (let eventName of eventNames) {
			let eventHandlers = this.#eventTypes[eventName].handlers;
			if (eventHandlers.has(handler)) {
				throw new Error('Handler already registered for the same event');
			}
			eventHandlers.add(handler);
		}

		return () => {
			for (let eventName of eventNames) {
				this.#eventTypes[eventName].handlers.delete(handler);
			}
		};
	}

	emit(eventName, data) {
		this.#data[eventName] = this.#eventTypes[eventName].collectFunc(this.#data[eventName], data);
		if (!this.#scheduled) {
			this.#scheduled = true;
			this.#waitFunc(() => this.#dispatch());
		}
	}

	#dispatch() {
		// Start collecting new events before handling events collected so far
		let data = this.#data;
		this.#data = {};
		this.#scheduled = false;

		// Collect unique handlers
		let handlers = new Set();
		for (let eventName in data) {
			for (let handler of this.#eventTypes[eventName].handlers) {
				handlers.add(handler);
			}
		}

		for (let handler of handlers) {
			handler(data);
		}
	}
}

export function asyncWaitFunc(callback) {
	(async () => {
		await Promise.resolve();
		callback();
	})();
}

export function nextLoopWaitFunc(callback) {
	setTimeout(callback);
}
