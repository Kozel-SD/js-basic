export const emptyIter = (function* () {})();

export function improveGeneratorProto() {
	let GeneratorPrototype = emptyIter.constructor.prototype;

	GeneratorPrototype.filter = function* (condition) {
		for (let x of this) {
			if (condition(x)) {
				yield x;
			}
		}
	};

	GeneratorPrototype.map = function* (func) {
		for (let x of this) {
			yield func(x);
		}
	};

	GeneratorPrototype.startWhen = function* (condition) {
		for (let x of this) {
			if (condition(x)) {
				yield x;
				yield* this;
				return;
			}
		}
	}

	GeneratorPrototype.stopWhen = function* (condition) {
		for (let x of this) {
			if (condition(x)) {
				return;
			}
			yield x;
		}
	};

	GeneratorPrototype.stopAfter = function* (condition) {
		for (let x of this) {
			yield x;
			if (condition(x)) {
				return;
			}
		}
	};

	GeneratorPrototype.slice = function* (start, end) {
		if (end === 0) {
			return;
		}
		let i;
		for (i = 0; i < start; i++) {
			if (this.next().done) {
				return;
			}
		}
		if (!end) {
			yield* this;
			return;
		}
		for (let x of this) {
			if (i >= end) {
				return;
			}
			i++;
			yield x;
		}
	}
}

export function* wrap(iterable) {
	for (let x of iterable) {
		yield x;
	}
}

export function* concat(...iterables) {
	for (let iterable of iterables) {
		for (let x of iterable) {
			yield x;
		}
	}
}
