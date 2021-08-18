/**
 * @param {Object} src
 * @param {function(string, *): boolean} condition
 * @param {Object=} base
 * @returns {Object}
 */
export function objectFilter(src, condition, base = {}) {
	for (let key in src) {
		if (condition(src[key], key)) {
			base[key] = src[key];
		}
	}
	return base;
}

/**
 * @param {Object} src
 * @param {function(string, *): *} map
 * @param {Object=} base
 * @returns {Object}
 */
export function objectMap(src, map, base = {}) {
	for (let key in src) {
		base[key] = map(src[key], key);
	}
	return base;
}

/**
 * @param {Object<string, Promise>} src
 * @param {Object=} base
 * @returns {Promise<Object>}
 */
export async function objectAwaitAsync(src, base = {}) {
	for (let key in src) {
		base[key] = await src[key];
	}
	return base;
}
