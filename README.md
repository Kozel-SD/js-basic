# Transpilation notes
This code uses latest features of ES6, including private class fields. Babel transpiles private fields to something scary.
If they impact performance of your code significantly, you might consider using
[`privateFieldsAsProperties` compiler assumption](https://babeljs.io/docs/en/assumptions#privatefieldsasproperties)
or even replacing all `#`'s with `_` in JS files inside `@kozel/basic` as a preprocessing step.
The latter is guaranteed not to break anything if you use this package as is.
# Event dispatcher
Observer implementation that allows its clients to subscribe on registered events, delays event handling to a later moment,
collects event data using custom logic, and provides every event handler with all collected event data.

If an event is emitted during event handling, it will be delayed.
```javascript
import {
	EventDispatcher,
	nextLoopWaitFunc
} from '@kozel/basic';

// This dispatcher will generally reproduce the behaviour of an ordinary observer pattern,
// i. e. all appropriate event handlers are called immediately on every event.
let classicDispatcher = new EventDispatcher(callback => callback());

// This dispatcher will delay event handling using setTimeout.
let dispatcher = new EventDispatcher(nextLoopWaitFunc);
// All event names must be registered before corresponding events are emitted.
dispatcher.registerEvent('add', (collectedData, data) => {
	if (!collectedData) {
		return [data];
	}
	collectedData.push(data);
	return collectedData;
});
dispatcher.registerEvent('flag', () => true);
// Spaces can be used in event names.
dispatcher.registerEvent('not emitted', (collectedData, data) => (collectedData || 0) + data);

// Creates one subscription, even though more than one event name has been provided,
// so the handler would be called once even if 'not emitted' event were also emitted.
// To avoid unexpected behaviour, don't mutate the array of event names after subscription.
// Registering the same handler twice for the same event throws an error because it might lead to unexpected behaviour after unsubscription.
dispatcher.subscribe([
	'add',
	'not emitted'
], console.log);

// This handler won't be called because it's unsubscribed before dispatching.
// It would be called (twice) if we used classicDispatcher instead of dispatcher.
let unsubscribe = dispatcher.subscribe(['add'], () => console.log('Not called'));

dispatcher.emit('add', 3);
dispatcher.emit('add', 8);
dispatcher.emit('flag');
console.log('Emitted');

unsubscribe();

/* Output:
Emitted
{ add: [ 3, 8 ], flag: true }
*/
```
## asyncWaitFunc
Function that can be passed in the `EventDispatcher` constructor. Calls its callback after awaiting `Promise.resolve()`.
## nextLoopWaitFunc
Function that can be passed in the `EventDispatcher` constructor. Calls its callback using `setTimeout` with zero delay.
# Promise cache
```javascript
import {
	PromiseCache
} from '@kozel/basic';

let cache = new PromiseCache();

// A value can be requested before a task that obtains it is started...
let valuePromise = cache.getAsync('value A');

// ... or after that.
cache.resolve('value B', 2);
console.log(await cache.getAsync('value B')); // Output: 2

// There is a synchronous getter
console.log(cache.get('value B')); // Output: 2

// and another synchronous getter that throws an error if there is no value
console.log(cache.getChecked('value X'));

// Values can be resolved through a promise.
cache.resolve('value A', Promise.resolve(1));
console.log(await valuePromise); // Output: 1

// You can pass a default value in the synchronous getter.
console.log(cache.get('value X', true)); // Output: true
// WARNING: promises are never fulfilled synchronously (but can be rejected synchronously)
cache.resolve('value X', true);
console.log(cache.get('value X', false)); // Output: false

// Waits for both 'value C' and 'value D' will be rejected; 'value C' is rejected synchronously.
cache.reject('value C', new Error('C is unavailable'));
cache.resolve('value D', Promise.reject(new Error('D is unavailable')));

// When called to request a rejected value, synchronous getters throw the error associated to the rejection.
cache.get('value C'); // this will throw
cache.get('value D'); // this won't throw now because the rejection hasn't been applied yet

// Resolved (both fulfilled and rejected) promises can be cleared.
// Attempts to drop a pending promise will have no effect.
cache.drop('value A');

// A pending task registered to resolve a promise can be unregistered.
let cancel = cache.resolve('value A', new Promise(resolve => setTimeout(() => resolve(42), 1000)));
// Calling cancel will have no effect if the promise has already been resolved.
setTimeout(cancel, 200);
// This promise will never be resolved unless we call another cache.resolve or cache.reject for 'value A'.
valuePromise = cache.getAsync('value A');
```
# Object utilities
```javascript
import {
	objectFilter,
	objectMap,
	objectAwaitAsync
} from '@kozel/basic';

// objectAwaitAsync throws an error if any of promises is rejected.
// Values that aren't promise-like are allowed.
let testObject = await objectAwaitAsync({
	a: Promise.resolve(5),
	b: Promise.resolve(2),
	c: Promise.resolve(3)
});
console.log(testObject);
console.log(objectFilter(testObject, (value, key) => value > 4 || key === 'c'));
console.log(objectMap(testObject, (value, key) => `${key}: ${value + 3}`));

/* Output:
{ a: 5, b: 2, c: 3 }
{ a: 5, c: 3 }
{ a: 'a: 8', b: 'b: 5', c: 'c: 6'}
*/
```
If an object is provided as an additional parameter, these functions will mutate it instead of creating a new object:
```javascript
let base = {
	a: 'a',
	b: 'b'
};
let source = {
	a: 'new a',
	b: 'new b',
	c: 'new c'
};

objectFilter(source, (value, key) => key !== 'a', base);
console.log(base);

/* Output:
{ a: 'a', b: 'new b', c: 'new c' }
*/
```
# Safe wrappers
## safeWrap
Wrapper for a function that could throw an error. The provided function is called immediately without arguments.
```javascript
import {
	safeWrap
} from '@kozel/basic';

console.log(safeWrap(() => 'Sync result'));
console.log(safeWrap(() => {
	throw 'Sync error';
}));

/* Output:
{ result: 'Sync result', isError: false }
{ result: 'Sync error', isError: true }
*/
```
## safeWrapFunc
Wrapper for a function that could throw an error. Returns a function that passes its arguments to the provided function.
```javascript
import {
	safeWrapFunc
} from '@kozel/basic';

const resultFunc = safeWrapFunc((a, b) => a + b);
const errorFunc = safeWrapFunc(message => {
	throw message;
});

console.log(resultFunc(2, 3));
console.log(errorFunc('Func error'));

/* Output:
{ result: 5, isError: false }
{ result: 'Func error', isError: true }
*/
```
## safeWrapAsync
Wrapper for a promise that could be rejected.
```javascript
import {
	safeWrapAsync
} from '@kozel/basic';

let [
	result,
	error
] = await Promise.all([
	safeWrapAsync(Promise.resolve('Async result')),
	safeWrapAsync(Promise.reject('Async error'))
]);

console.log(result);
console.log(error);

/* Output:
{ result: 'Async result', isError: false }
{ result: 'Async error', isError: true }
*/
```
# Parallel task limiter
Can be used to ensure that a limited number of tasks are run simultaneously.
```javascript
import {
	Parallel
} from '@kozel/basic';

let parallel = new Parallel(5); // Allow 5 tasks to run in parallel
let time = Date.now();

async function generateTaskAsync(x) {
	let unlock = await parallel.waitAsync();
	console.log('Started', x, Date.now() - time);
	await new Promise(resolve => setTimeout(resolve, Math.random() * 2000));
	unlock();
	console.log('Finished', x, Date.now() - time);
}

let promises = [];

for (let i = 0; i < 10; i++) {
	// Queue all the tasks with a short delay
	await new Promise(resolve => setTimeout(resolve, 100));
	console.log('Queued', i, Date.now() - time);
	promises.push(generateTaskAsync(i));
}

(async () => {
	// Convenience method that returns the result of the provided function and guarantees to unlock after completion (with either a result or an error)
	let x = await parallel.getAsync(() => Promise.resolve(42));
	console.log(x); // This will print 42 as soon as there is an empty slot for this task
})();

await Promise.all(promises);
```
# Iterator methods
```javascript
import {
	improveGeneratorProto,
	wrap,
	concat
} from '@kozel/basic';

// After calling improveGeneratorProto, you can use additional methods on iterators created by generator functions.
improveGeneratorProto();

function print(message, iter) {
	console.log(`${message}: ${[...iter].join(', ')}`);
}

function getTestIter() {
	// If your iterable is not created by a generator, you can wrap it:
	let iter = wrap([5, 2, 18, 34, 11, 100]);
	// concat function concatenates all given iterables and wraps the result:
	return concat([1, 6, 5], iter, [18, 72]);
}

print('Original', getTestIter()); // 1, 6, 5, 5, 2, 18, 34, 11, 100, 18, 72

print('filter', getTestIter().filter(x => x > 20)); // 34, 100, 72
print('map', getTestIter().map(x => x + 5)); // 6, 11, 10, 10, 7, 23, 39, 16, 105, 23, 77
print('startWhen', getTestIter().startWhen(x => x > 20)); // 34, 11, 100, 18, 72
print('stopWhen', getTestIter().stopWhen(x => x > 20)); // 1, 6, 5, 5, 2, 18
print('stopAfter', getTestIter().stopAfter(x => x > 20)); // 1, 6, 5, 5, 2, 18, 34
print('slice', getTestIter().slice(3, 6)); // 5, 2, 18
print('slice with end = 0', getTestIter().slice(3, 0)); // nothing
print('slice with no end', getTestIter().slice(3)); // 5, 2, 18, 34, 11, 100, 18, 72

// All the provided methods are lazy
function* integers() {
	let n = 0n;
	// Infinite sequence of integers
	while (true) {
		yield n;
		n++;
	}
}

let primes = [];
function isPrime(n) {
	let result = primes.every(p => n % p > 0n);
	if (result) {
		primes.push(n);
	}
	return result;
}

print('First 100 primes', integers().startWhen(x => x > 1).filter(isPrime).slice(0, 100));
```
# Periodic worker
Runs a task repeatedly with a delay between runs.
```javascript
import {
	PeriodicWorker
} from '@kozel/basic';
import {
	emitKeypressEvents
} from 'readline';

function log(message) {
	console.log(new Date().toISOString(), message);
}

async function runTaskAsync() {
	let delay = Math.round(Math.random() * 4000);
	log(`Waiting for ${delay} ms...`);
	await new Promise(resolve => setTimeout(resolve, delay));
	log('Finished');
}

let worker = new PeriodicWorker(runTaskAsync, 3000, {
	disabledOnStart: false, // if true, does not schedule the task until the worker is resumed. False by default.
	runImmediately: false // if true, starts the task for the first time instead of scheduling it. False by default.
});

// Intercepting keypresses to use them as commands
process.stdin.setRawMode(true);
emitKeypressEvents(process.stdin);

process.stdin.on('keypress', key => {
	switch (key) {
		case 'g':
			// Promise returned by runTaskAsync if the task is being run, or null otherwise.
			log(worker.currentRun);
			break;
		case 'p':
			// Stops future scheduling of the task.
			// When the worker is resumed, the task is scheduled to run after the remaining duration.
			worker.pause();
			log('Paused');
			break;
		case 's':
			// Stops future scheduling of the task.
			// When the worker is resumed, the task is scheduled to run after the full delay (even if the worker is on pause when it's stopped).
			worker.stop();
			log('Stopped');
			break;
		case 'r':
			// Resumes the worker.
			worker.resume();
			log('Resumed');
			break;
		case 'f':
			// Runs the task immediately.
			// If the worker is on pause or the task in being run, does nothing.
			worker.forceRun(false);
			break;
		case 'F':
			// Runs the task immediately.
			// If the worker is on pause, runs the task and makes the worker wait for the full delay on resume.
			// If the task is being run, does nothing.
			worker.forceRun(true);
			break;
		case 'q':
			process.exit();
		default:
			console.error('Unknown command', key);
			break;
	}
});
```
# Debounce
Another implementation of debounce that does not spam with `setTimeout` and `clearTimeout`.

Does not support function arguments.
```javascript
import {
	debounce
} from '@kozel/basic';

let time = Date.now();
let debouncedFunc = debounce(() => console.log('Called!', Date.now() - time), 1000);
for (let i = 0; i < 1000; i++) {
	debouncedFunc();
}
setTimeout(() => {
	for (let i = 0; i < 1000; i++) {
		debouncedFunc();
	}
}, 500);
// The callback is invoked ~1500ms after the start, and only 2 timeouts are created inside debounce.

let anotherFunc = debounce(() => console.log('Flushed!', Date.now() - time), 1000);
// Debounced function has flush method that can be used to invoke the callback immediately and cancel debounced invocations.
anotherFunc.flush(); // Does nothing because there are no invocations to debounce
anotherFunc();
setTimeout(() => anotherFunc.flush(), 500);
```
# Lock list
```javascript
import {
	LockList
} from '@kozel/basic';

let lockList = new LockList({
	// Both callbacks are optional
	onLock: () => console.log('Locked'), // Called after switching to locked state
	onUnlock: () => console.log('Unlocked') // Called after switching to unlocked state
});
console.log(lockList.isLocked); // false
let unlockA = lockList.addLock();
console.log(lockList.isLocked); // true
let unlockB = lockList.addLock();
console.log(lockList.isLocked); // true
unlockA();
console.log(lockList.isLocked); // true
unlockA();
console.log(lockList.isLocked); // still true
unlockB();
console.log(lockList.isLocked); // false
```
