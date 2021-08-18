export class PeriodicWorker {
	#func;
	#delay;
	#currentTimeout = null;
	#lastSchedule = null;
	#pausedDelay = null;
	#currentRun = null;
	#enabled;

	/**
	 * @param {function(): Promise} funcAsync
	 * @param {number} delay
	 * @param {PeriodicWorkerOptions=} options
	 */
	constructor(funcAsync, delay, options = {}) {
		this.#func = funcAsync;
		this.#delay = delay;
		this.#enabled = !options.disabledOnStart;
		if (options.runImmediately) {
			this.#runAsync();
		} else {
			this.#schedule();
		}
	}

	/**
	 * @returns {Promise | null}
	 */
	get currentRun() {
		return this.#currentRun;
	}

	/**
	 * @param {boolean} runIfStopped
	 */
	forceRun(runIfStopped) {
		if (this.#currentRun) {
			return;
		}
		let run = runIfStopped;
		if (this.#currentTimeout) {
			clearTimeout(this.#currentTimeout);
			run = true;
		}
		if (run) {
			this.#pausedDelay = null;
			this.#runAsync();
		}
	}

	pause() {
		if (this.#currentTimeout) {
			clearTimeout(this.#currentTimeout);
			this.#currentTimeout = null;
			this.#pausedDelay = this.#lastSchedule - Date.now() + this.#delay;
		}
		this.#enabled = false;
	}

	stop() {
		if (this.#currentTimeout) {
			clearTimeout(this.#currentTimeout);
			this.#currentTimeout = null;
		}
		this.#pausedDelay = null;
		this.#enabled = false;
	}

	resume() {
		this.#enabled = true;
		if (!this.#currentRun) {
			this.#schedule();
		}
	}

	async #runAsync() {
		try {
			this.#currentTimeout = null;
			this.#currentRun = this.#func();
			await this.#currentRun;
		} finally {
			this.#currentRun = null;
			this.#schedule();
		}
	}

	#schedule() {
		if (!this.#enabled) {
			return;
		}
		this.#lastSchedule = Date.now();
		this.#currentTimeout = setTimeout(() => this.#runAsync(), this.#pausedDelay !== null ? this.#pausedDelay : this.#delay);
		this.#pausedDelay = null;
	}
}

/**
 * @typedef {{
 * 	runImmediately?: boolean,
 * 	disabledOnStart?: boolean
 * }} PeriodicWorkerOptions
 */
