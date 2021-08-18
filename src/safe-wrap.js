/**
 * @template T
 * @param {function(): T} func
 * @returns {SafeWrapResult<T>}
 */
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

/**
 * @template T
 * @param {Promise<T>} promise
 * @returns {Promise<SafeWrapResult<T>>}
 */
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

/**
 * @template T
 * @typedef {{
 * 	result: T,
 * 	isError: boolean
 * }} SafeWrapResult
 */
