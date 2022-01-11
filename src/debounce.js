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
