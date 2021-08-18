export class LockList {
	#count = 0;
	#onLock;
	#onUnlock;

	/**
	 * @param {{
	 *  onLock?: function(): void,
	 *  onUnlock?: function(): void
	 * }=} options
	 */
	constructor(options) {
		if (options) {
			this.#onLock = options.onLock;
			this.#onUnlock = options.onUnlock;
		}
	}

	/**
	 * @returns {boolean}
	 */
	get isLocked() {
		return this.#count > 0;
	}

	/**
	 * @returns {function(): void}
	 */
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
