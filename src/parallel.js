const nop = () => {};

export class Parallel {
	#lock;
	#unlock;
	#queued = 0;
	#parallel;

	/**
	 * @param {number} parallel
	 */
	constructor(parallel) {
		this.#parallel = parallel;
	}

	/**
	 * @returns {number}
	 */
	get queued() {
		return this.#queued;
	}

	/**
	 * @returns {Promise<function(): void>}
	 */
	async waitAsync() {
		// Let ThisCall be this invocation of waitAsync and NextCall be an invocation that may happen next after this one

		// Ensure that the counter is decreased only once
		let isActive = true;
		this.#queued++;

		let unlock = nop;
		if (this.#queued < this.#parallel) {
			// There are still empty slots, no need to lock anything or set up #unlock
			this.#lock = Promise.resolve();
		} else {
			let lock = this.#lock;
			// Prepare a locking promise for NextCall
			this.#lock = new Promise(resolve => {
				unlock = resolve;
			});
			// Wait for the locking promise prepared for ThisCall
			await lock;
		}
		// Set up #unlock to complete the locking promise for NextCall
		this.#unlock = unlock;
		return () => {
			if (isActive) {
				isActive = false;
				this.#queued--;
				this.#unlock();
			}
		};
	}

	/**
	 * @template T
	 * @param {function(): Promise<T>} getterAsync
	 * @returns {Promise<T>}
	 */
	async getAsync(getterAsync) {
		let unlock = await this.waitAsync();
		try {
			return await getterAsync();
		} finally {
			unlock();
		}
	}
}
