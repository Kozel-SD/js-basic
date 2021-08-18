const nop = () => {};

/**
 * @template IdType, ValueType
 */
export class PromiseCache {
	// The cache holds proxy promises for each value ID instead of source promises, so the values can be awaited and obtained independeltly
	#cache = new Map();

	/**
	 * @param {IdType} id
	 * @param {ValueType=} defaultValue
	 * @returns {ValueType | undefined}
	 * @throws {Error}
	 */
	get(id, defaultValue) {
		let handle = this.#cache.get(id);
		if (!handle || !handle.done) {
			return defaultValue;
		}
		if (handle.isError) {
			throw handle.error;
		}
		return handle.value;
	}

	/**
	 * @param {IdType} id
	 * @returns {ValueType}
	 * @throws {Error}
	 */
	getChecked(id) {
		let handle = this.#cache.get(id);
		if (!handle || !handle.done) {
			throw new Error('No value');
		}
		if (handle.isError) {
			throw handle.error;
		}
		return handle.value;
	}

	/**
	 * @param {IdType} id
	 * @returns {Promise<ValueType>}
	 * @throws {Error}
	 */
	getAsync(id) {
		let handle = this.#cache.get(id);
		if (!handle) {
			// No cache entry, create a proxy promise
			handle = {
				done: false
			};
			handle.promise = new Promise((resolve, reject) => {
				handle.resolve = resolve;
				handle.reject = reject;
			});
			this.#cache.set(id, handle);
		}
		return handle.promise;
	}

	/**
	 * @param {IdType} id
	 * @param {ValueType | Promise<ValueType>} value
	 * @returns {function(): void}
	 */
	resolve(id, value) {
		let isCancelled = false;

		this.#resolveAsync(id, value, () => isCancelled);

		return () => {
			isCancelled = true;
		};
	}

	/**
	 * @param {IdType} id
	 * @param {Error} error
	 */
	reject(id, error) {
		let handle = this.#cache.get(id);
		if (handle) {
			if (handle.done) {
				return;
			}
			// Reject the proxy promise
			handle.reject(error);
			handle.isError = true;
			handle.error = error;
			handle.done = true;
		} else {
			// A value by the given ID hasn't been requested yet, create a rejected promise
			handle = {
				promise: Promise.reject(error),
				error,
				done: true,
				resolve: nop,
				reject: nop
			};
			// Avoid unhandled rejection error
			handle.promise.catch(nop);
			this.#cache.set(id, handle);
		}
	}

	/**
	 * @param {IdType} id
	 */
	drop(id) {
		let handle = this.#cache.get(id);
		if (handle && handle.done) {
			this.#cache.delete(id);
		}
	}

	async #resolveAsync(id, value, isCancelled) {
		try {
			// Await the value in case it's thenable and may be rejected
			value = await value;
		} catch (e) {
			if (!isCancelled()) {
				this.reject(id, e);
			}
			return;
		}
		if (isCancelled()) {
			return;
		}
		let handle = this.#cache.get(id);
		if (handle) {
			if (handle.done) {
				return;
			}
			// Fulfill the proxy promise
			handle.resolve(value);
			handle.value = value;
			handle.done = true;
		} else {
			// A value by the given ID hasn't been requested yet, create a fulfilled promise
			this.#cache.set(id, {
				promise: Promise.resolve(value),
				value,
				done: true,
				resolve: nop,
				reject: nop
			});
		}
	}
}
