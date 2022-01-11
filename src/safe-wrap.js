export function safeWrap(func) {
	try {
		return {
			result: func(),
			isError: false
		};
	} catch (e) {
		return {
			result: e,
			isError: true
		};
	}
}

export async function safeWrapAsync(promise) {
	try {
		let result = await promise;
		return {
			result,
			isError: false
		};
	} catch (e) {
		return {
			result: e,
			isError: true
		};
	}
}
