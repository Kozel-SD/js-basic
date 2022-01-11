export function objectFilter(src, condition, base = {}) {
	for (let key in src) {
		if (condition(src[key], key)) {
			base[key] = src[key];
		}
	}
	return base;
}

export function objectMap(src, map, base = {}) {
	for (let key in src) {
		base[key] = map(src[key], key);
	}
	return base;
}

export async function objectAwaitAsync(src, base = {}) {
	for (let key in src) {
		base[key] = await src[key];
	}
	return base;
}
