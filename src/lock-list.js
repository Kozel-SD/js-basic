export class LockList {
	#count = 0;
	#onLock;
	#onUnlock;

	constructor(options) {
		if (options) {
			this.#onLock = options.onLock;
			this.#onUnlock = options.onUnlock;
		}
	}

	get isLocked() {
		return this.#count > 0;
	}

	addLock() {
		let needEmit = this.#onLock && !this.isLocked;

		// Ensure that the counter is decreased only once
		let isActive = true;
		this.#count++;

		if (needEmit) {
			this.#onLock();
		}

		return () => {
			if (!isActive) {
				return;
			}
			isActive = false;
			this.#count--;
			if (this.#onUnlock && !this.isLocked) {
				this.#onUnlock();
			}
		};
	}
}
