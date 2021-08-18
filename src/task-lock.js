export class TaskLock {
	#current;

	/**
	 * @returns {Promise<function(): void>}
	 */
	async waitAsync() {
		while (this.#current) {
			await this.#current;
		}
		let complete;
		this.#current = new Promise(resolve => {
			complete = () => {
				this.#current = null;
				resolve();
			};
		});
		return complete;
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
