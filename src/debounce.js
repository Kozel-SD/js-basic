export function debounce(func, timeout) {
	let lastCallTime; // Timestamp of the last call during the last timer
	let timer = null;

	const startTimer = time => {
		lastCallTime = null;

		timer = setTimeout(() => {
			if (lastCallTime === null) {
				// There were no calls since the last timer start - forget the timer and call the target function
				timer = null;
				func();
			} else {
				// Calculate remaining time
				startTimer(lastCallTime - Date.now() + timeout);
			}
		}, time);
	};

	let result = () => {
		if (timer === null) {
			startTimer(timeout);
		} else {
			lastCallTime = Date.now();
		}
	};

	result.flush = () => {
		if (timer === null) {
			return;
		}
		clearTimeout(timer);
		timer = null;
		func();
	};

	return result;
}

export function debounceAsync(funcAsync, timeout) {
	let lastCallTime; // Timestamp of the last call during the last timer or the current task run
	let timer = null;
	let currentRun = null;
	let startTimer;

	const runAsync = async () => {
		timer = null;

		try {
			currentRun = funcAsync();
			await currentRun;
		} finally {
			currentRun = null;
			if (lastCallTime !== null) {
				// There was a call during the run
				startTimer(timeout);
			}
		}
	};

	startTimer = time => {
		lastCallTime = null;

		timer = setTimeout(() => {
			if (lastCallTime === null) {
				// There were no calls since the last timer start - forget the timer and call the target function
				runAsync();
			} else {
				// Calculate remaining time
				startTimer(lastCallTime - Date.now() + timeout);
			}
		}, time);
	};

	let result = () => {
		if (timer === null && !currentRun) {
			startTimer(timeout);
		} else {
			lastCallTime = Date.now();
		}
	};

	result.flush = () => {
		if (timer === null) {
			let result = lastCallTime !== null ? currentRun : null;
			lastCallTime = null;
			return result;
		}
		clearTimeout(timer);
		runAsync();
		return null;
	};

	return result;
}
