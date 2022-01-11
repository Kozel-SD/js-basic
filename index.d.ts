export interface TypedObject<T> {
	[key: string]: T;
}

export interface DebounceFunc {
	(): void;
	flush: () => void;
}
export function debounce(func: () => void, timeout: number): DebounceFunc;

export type WaitFunc = (callback: () => void) => void;
export const asyncWaitFunc: WaitFunc;
export const nextLoopWaitFunc: WaitFunc;
export class EventDispatcher<EventData, CollectedEventData> {
	constructor(waitFunc: WaitFunc);
	registerEvent(eventName: string, collectFunc: (collectedData: CollectedEventData | undefined, eventData: EventData) => CollectedEventData): void;
	subscribe(eventNames: string[], handler: (collectedData: TypedObject<CollectedEventData>) => void): () => void;
	emit(eventName: string, data: EventData): void;
}

export function improveGeneratorProto(): void;
export function wrap<T>(iterable: Iterable<T>): Generator<T>;
export function concat<T>(...iterables: Iterable<T>[]): Generator<T>;

export interface LockListConfig {
	onLock?: () => void;
	onUnlock?: () => void;
}
export class LockList {
	constructor(options?: LockListConfig);
	get isLocked(): boolean;
	addLock(): () => void;
}

export function objectFilter<TValue>(src: TypedObject<TValue>, condition: (value: TValue, key: string) => boolean): TypedObject<TValue>;
export function objectFilter<TValue, TBase>(src: TypedObject<TValue>, condition: (value: TValue, key: string) => boolean, base: TBase): TBase | TypedObject<TValue>;
export function objectMap<TValueSrc, TValueDst>(src: TypedObject<TValueSrc>, map: (value: TValueSrc, key: string) => TValueDst): TypedObject<TValueDst>;
export function objectMap<TValueSrc, TValueDst, TBase>(src: TypedObject<TValueSrc>, map: (value: TValueSrc, key: string) => TValueDst, base: TBase): TBase | TypedObject<TValueDst>;
export function objectAwaitAsync<TValue>(src: TypedObject<TValue | PromiseLike<TValue>>): TypedObject<TValue>;
export function objectAwaitAsync<TValue, TBase>(src: TypedObject<TValue | PromiseLike<TValue>>, base: TBase): TBase | TypedObject<TValue>;

export class Parallel {
	constructor(parallel: number);
	get queued(): number;
	waitAsync(): Promise<() => void>;
	getAsync<T>(getterAsync: () => PromiseLike<T>): Promise<T>;
}

export interface PeriodicWorkerConfig {
	runImmediately?: boolean;
	disabledOnStart?: boolean;
}
export class PeriodicWorker {
	constructor(funcAsync: () => PromiseLike<void>, delay: number, options?: PeriodicWorkerConfig);
	get currentRun(): PromiseLike<void> | null;
	forceRun(runIfStopped: boolean): void;
	pause(): void;
	stop(): void;
	resume(): void;
}

export class PromiseCache<TId, TValue> {
	constructor();
	get(id: TId): TValue | undefined | never;
	get(id: TId, defaultValue: TValue): TValue | never;
	getChecked(id: TId): TValue | never;
	getAsync(id: TId): Promise<TValue>;
	resolve(id: TId, value: TValue | PromiseLike<TValue>): () => void;
	reject(id: TId, error: Error): void;
	drop(id: TId): void;
}

export type SafeWrapResult<T> = {
	isError: false,
	result: T
} | {
	isError: true,
	result: Error
};
export function safeWrap<T>(func: () => T): SafeWrapResult<T>;
export function safeWrapAsync<T>(promise: PromiseLike<T>): Promise<SafeWrapResult<T>>;
