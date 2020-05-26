import React from "react";

type UnsubscribeFunction = () => void;

/**
 * Core client interface for an IObservable collection keyed by K with values of type V.
 */
export interface IObservable<T, TAction extends string = string> {
	/**
	 * subscribe should be called when the caller wants to be notified about changes to
	 * the underlying data. The caller should only call once per delegate, but will
	 * get notified N times (once for each call to subscribe).
	 *
	 * @param observer - This is the delegate to be notified when the underlying data changes.
	 *
	 * @param action - Optional argument that allows the consumer to supply a action
	 *  with the delegate. If the action is supplied only those actions are delievered,
	 *  while all actions are delivered is no action is supplied.
	 */
	subscribe: (observer: (value: T, action: TAction) => void, action?: TAction) => UnsubscribeFunction;

	/**
	 * unsubscribe should be called with a previously supplied delegate to subscribe.
	 * The client MUST call unsubscribe once for every call to subscribe with the
	 * appropriate delegates.
	 *
	 * @param observer - This is the delegate that was previously registered with subscribe.
	 *
	 * @param action - Optional argument that defines the action that was subscribed to.
	 */
	unsubscribe: (observer: (value: T, action: TAction) => void, action?: TAction) => void;
}

/**
 * IObservableEvent<T> encapsulates the data used to send a notification.
 */
interface IObservableEvent<T, TAction extends string = string> {
	// An IObservableEvent should ALWAYS have the _action value ...
	action: TAction;

	// along with any other properties that are valid for the event type
	value: T;
}

/**
 * An Observable implementation that will track a set of subscribers and supports
 * notifications when the underlying system changes.
 */
export class Observable<T, TAction extends string = string> implements IObservable<T, TAction> {
	private observers: { [action: string]: ((value: T, action: TAction) => void)[] } = {};
	private events?: IObservableEvent<T, TAction>[];
	protected subscriberCount = 0;

	/**
	 * notify is used to send the event to all subscribers that have signed up for this events
	 * action. This means they have subscribed directly to this action, or to all actions.
	 * If the caller requested the event be persisted the event will be fired in order to new
	 * subscribers as well when they subscribe.
	 *
	 * @param value - The object that represents the event data.
	 *
	 * @param action - The action that happened on this observable to produce the event.
	 *
	 * @param persistEvent - Optional value that determines if all future subscribers will
	 *  recieve the event as well.
	 */
	public notify(value: T, action: TAction, persistEvent?: boolean): void {
		const executeObserverAction = (observer: (value: T, action: TAction) => void, value: T, action: TAction) => {
			try {
				observer(value, action);
			} catch (ex) {
				console.warn(ex);

				if (ex && typeof ErrorEvent === "function") {
					window.dispatchEvent(
						new ErrorEvent("error", {
							error: ex,
							filename: "Observable.ts",
							message: ex.message,
						})
					);
				}
			}
		};

		// NOTE: We need to make a copy of the observers since they may change during notification.
		if (this.observers[action]) {
			const observers = this.observers[action].slice();
			for (let observerIndex = 0; observerIndex < observers.length; observerIndex++) {
				executeObserverAction(observers[observerIndex], value, action);
			}
		}

		if (this.observers[""]) {
			const observers = this.observers[""].slice();
			for (let observerIndex = 0; observerIndex < observers.length; observerIndex++) {
				executeObserverAction(observers[observerIndex], value, action);
			}
		}

		// If the caller wants this event sent to all subscribers, even future ones, track it.
		if (persistEvent) {
			if (!this.events) {
				this.events = [];
			}

			this.events.push({ action: action, value: value });
		}
	}

	public subscribe(observer: (value: T, action: TAction) => void, action?: string): UnsubscribeFunction {
		action = action || "";
		if (!this.observers[action]) {
			this.observers[action] = [];
		}

		this.observers[action].push(observer);
		this.subscriberCount++;

		// Fire the callback for any events that were persisted when they were sent.
		if (this.events) {
			for (const event of this.events) {
				if (!action || event.action === action) {
					observer(event.value, event.action);
				}
			}
		}

		return () => this.unsubscribe(observer, action);
	}

	public unsubscribe(observer: (value: T, action: TAction) => void, action?: string): void {
		action = action || "";
		if (this.observers[action]) {
			const observerIndex = this.observers[action].indexOf(observer);
			if (observerIndex >= 0) {
				this.observers[action].splice(observerIndex, 1);
				this.subscriberCount--;
			}
		}
	}
}

export type IObservableLikeValue<T> = IObservableValue<T> | T;
export type IObservableLikeArray<T> = IObservableArray<T> | IReadonlyObservableArray<T> | T[];

/* eslint-disable @typescript-eslint/no-namespace, no-inner-declarations */
export class ObservableLike {
	/**
	 * Check whether the specified object is an observable or not.
	 *
	 * @param observableLike Object to perform observable check.
	 */
	public static isObservable<T>(observableLike: IObservable<T> | any): boolean {
		return observableLike && typeof (observableLike as IObservable<T>).subscribe === "function";
	}

	/**
	 * Gets the value of the specified observable like. If not observable, returns the passed argument.
	 *
	 * @param observableLike Object to get the value.
	 * @returns Observable value or the observable like itself.
	 */
	public static getValue<T>(observableLike: IObservableLikeValue<T>): T;

	/**
	 * Gets the value of the specified observable like. If not observable, returns the passed argument.
	 *
	 * @param observableLikeArray Object to get the value.
	 * @returns Observable value or the observable like itself.
	 */
	public static getValue<T>(observableArrayLike: IObservableLikeArray<T>): T[];

	public static getValue<T>(observableLike: IObservableLikeValue<T> | IObservableLikeArray<T>): T | T[] {
		if (ObservableLike.isObservable(observableLike)) {
			return (observableLike as IObservableValue<T>).value;
		}

		return observableLike as T;
	}

	/**
	 * Subscribes to the specified object if it is an observable.
	 *
	 * @param observableLike Object to subscribe its value change if applicable.
	 * @param observer Delegate to be executed when the underlying data changes.
	 * @param action Optional argument that allows the consumer to supply a action
	 *  with the delegate. If the action is supplied only those actions are delievered,
	 *  while all actions are delivered is no action is supplied.
	 */
	public static subscribe<T>(
		observableLike: IObservable<T> | any,
		observer: (value: T, action: string) => void,
		action?: string
	): void {
		if (ObservableLike.isObservable(observableLike)) {
			(observableLike as IObservable<T>).subscribe(observer, action);
		}
	}

	/**
	 * Unsubscribes from the specified object if it is an observable.
	 *
	 * @param observableLike Object to subscribe its value change if applicable.
	 * @param observer Delegate to be executed when the underlying data changes.
	 * @param action Optional argument that allows the consumer to supply a action
	 *  with the delegate. If the action is supplied only those actions are delievered,
	 *  while all actions are delivered is no action is supplied.
	 */
	public static unsubscribe<T>(
		observableLike: IObservable<T> | any,
		observer: (value: T, action: string) => void,
		action?: string
	): void {
		if (ObservableLike.isObservable(observableLike)) {
			(observableLike as IObservable<T>).unsubscribe(observer, action);
		}
	}
}
/* eslint-enable @typescript-eslint/no-namespace, no-inner-declarations */

/**
 * An IReadonlyObservableValue<T> gives a readonly view of an IObservableValue<T>.
 *
 * The normal pattern to follow is for a parent object/component creates an IObservableValue<T>
 * and pass it to dependants as an IReadonlyObservableValue<T>. This prevents the callee
 * from changing the value and treating the relationship as a two way binding. Observables
 * are intended to be used as a one way binding where the object owner uses the observable to
 * notify others about changes to the value without giving them control over the value.
 */
export interface IReadonlyObservableValue<T> extends IObservable<T> {
	/**
	 * Read access to the value being observed.
	 */
	readonly value: T;
}

/**
 * An IObservableValue<T> tracks an instance of type T and allows consumers
 * be notified with the value is changed.
 *
 * EventTypes:
 *  set - T
 */
export interface IObservableValue<T> extends IReadonlyObservableValue<T> {
	/**
	 * This is the current value of the observable.
	 */
	value: T;
}

export class ObservableValue<T> extends Observable<T> implements IObservableValue<T> {
	private v: T;

	constructor(value: T) {
		super();
		this.v = value;
	}

	public get value(): T {
		return this.v;
	}

	public set value(value: T) {
		this.v = value;
		this.notify(this.v, "set");
	}
}

/**
 * When an action occurs on an IObservableObject the event should take the form
 * of an IObjectProperty<T> where T is the type of the value being stored.
 */
export interface IObjectProperty<T> {
	key: string;
	value?: T;
}

/**
 * List of actions that are notified on the ObservableArray.
 */
export type ObservableArrayAction = "change" | "push" | "pop" | "splice" | "removeAll" | "sort" | "unshift";

/**
 * All ObservableArray events will have an action associated with them.
 */
export interface IObservableArrayEventArgs<T> {
	/**
	 * Items added to ObservableArray.
	 */
	addedItems?: T[];

	/**
	 * Items that were changed.
	 */
	changedItems?: T[];

	/**
	 * The index that the operation started.
	 */
	index: number;

	/**
	 * Items removed from ObservableArray.
	 */
	removedItems?: T[];
}

/**
 * An Observable array is used to track an array of items and offer notifications
 * for consumers when the array has changed.
 *
 * EventTypes:
 *  change - { changedItems, index }
 *  push - {addedItems, index }
 *  pop - { index, removedItems}
 *  removeAll - {index, removedItems }
 *  splice - { addedItems, index, removedItems }
 */
export interface IReadonlyObservableArray<T> extends IObservable<IObservableArrayEventArgs<T>, ObservableArrayAction> {
	filter: (predicate: (item: T) => boolean) => IObservableArray<T>;

	/**
	 * Gets the number of the items in the ObservableArray.
	 */
	readonly length: number;

	map: <TValue>(callback: (item: T, index: number, array: T[]) => TValue) => IObservableArray<TValue>;

	slice: (start: number, count: number) => IObservableArray<T>;

	/**
	 * Gets all the items in the ObservableArray.
	 */
	readonly value: T[];
}

/**
 * An Observable array is used to track an array of items and offer notifications
 * for consumers when the array has changed.
 *
 * EventTypes:
 *  change - { changedItems, index }
 *  push - {addedItems, index }
 *  pop - { index, removedItems}
 *  removeAll - {index, removedItems }
 *  splice - { addedItems, index, removedItems }
 */
export interface IObservableArray<T> extends IReadonlyObservableArray<T> {
	/**
	 * Change can be used to update a set of items in the array. Using change instead
	 * of splice allows any observers to potentially optimize the updates to only the
	 * affected data.
	 *
	 * @param start Zero based index of the first item to change.
	 * @param items The set of items to change.
	 */
	change: (start: number, ...items: T[]) => number;

	/**
	 * The length property can be used to determine the number of elements in
	 * the observable array.
	 */
	readonly length: number;

	/**
	 * Appends new elements to an array, and returns the new length of the array.
	 *
	 * NOTE: Use of ...array places all items onto the stack which can cause the
	 * browser to run out of stack space if you pass more than 32K/64K items (browser dependent).
	 * Use "value" or add items in batches in this case.
	 *
	 * @param items - new elements of the ObservableArray.
	 *
	 * @returns - number of the newly inserted items.
	 */
	push: (...items: T[]) => number;

	/**
	 * Removes the last element from an array and returns it.
	 *
	 * @returns - removed element or undefined if ObservableArray has no items.
	 */
	pop: () => T | undefined;

	/**
	 * Remove all items from the array that match the specified filter
	 *
	 * @param filter - Delegate which returns true for each item to remove. If undefined, all items in the array are removed.
	 */
	removeAll: (filter?: (item: T) => boolean) => void;

	sort: (comparer: (a: T, b: T) => number) => void;

	/**
	 * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
	 *
	 * NOTE: Use of ...array places all items onto the stack which can cause the
	 * browser to run out of stack space if you pass more than 32K/64K items (browser dependent).
	 * Use "value" or add items in batches in this case.
	 *
	 * @param start - Zero-based location in the array from which to start removing elements.
	 *
	 * @param deleteCount - Number of elements to remove.
	 *
	 * @param items - Elements to insert into the array in place of the deleted elements.
	 *
	 * @returns - deleted elements.
	 */
	splice: (start: number, deleteCount: number, ...items: T[]) => T[];

	/**
	 * Adds items to the start of the array
	 * @param items - Elements to insert into the start of the array
	 */
	unshift: (...items: T[]) => T[];

	/**
	 * Gets all the items in ObservableArray.
	 */
	value: T[];
}

/**
 * EventTypes:
 *  change - { changedItems, index }
 *  push - {addedItems, index }
 *  pop - { index, removedItems}
 *  removeAll - {index, removedItems }
 *  splice - { addedItems, index, removedItems }
 */
export class ObservableArray<T> extends Observable<IObservableArrayEventArgs<T>, ObservableArrayAction>
	implements IObservableArray<T> {
	protected internalItems: T[];

	constructor(items: T[] = []) {
		super();
		this.internalItems = items || [];
	}

	public change(start: number, ...items: T[]): number {
		this.internalItems.splice(start, items.length, ...items);
		this.notify({ index: start, changedItems: items }, "change");

		return items.length;
	}

	public filter(predicate: (k: T) => boolean): IObservableArray<T> {
		const result = new ObservableArray<T>(this.value.filter(predicate));
		this.subscribe((value, action) => {
			if (action === "push") {
				result.push(...value.addedItems.filter(predicate));
			} else if (action === "unshift") {
				result.unshift(...value.addedItems.filter(predicate));
			} else if (action === "pop") {
				if (predicate(value.removedItems[0])) {
					result.pop();
				}
			} else {
				result.splice(0, result.length, ...this.value.filter(predicate));
			}
		});
		return result;
	}

	public get length(): number {
		return this.internalItems.length;
	}

	public map<TValue>(callback: (k: T, index: number, array: T[]) => TValue): IObservableArray<TValue> {
		const result = new ObservableArray<TValue>(this.value.map(callback));
		this.subscribe((value, action) => {
			if (action === "push") {
				result.push(...value.addedItems.map(callback));
			} else if (action === "unshift") {
				result.unshift(...value.addedItems.map(callback));
			} else if (action === "pop") {
				result.pop();
			} else {
				result.splice(0, result.length, ...this.value.map(callback));
			}
		});
		return result;
	}

	public push(...items: T[]): number {
		if (items.length) {
			const index = this.internalItems.length;
			this.internalItems.push(...items);
			this.notify({ addedItems: items, index }, "push");
		}

		return items.length;
	}

	public pop(): T | undefined {
		const item = this.internalItems.pop();
		if (item !== undefined) {
			this.notify({ index: this.internalItems.length, removedItems: [item] }, "pop");
		}

		return item;
	}

	public removeAll(filter?: (item: T) => boolean): T[] {
		const removedItems: T[] = [];
		const remainingItems: T[] = [];

		for (const item of this.internalItems) {
			if (!filter || filter(item)) {
				removedItems.push(item);
			} else {
				remainingItems.push(item);
			}
		}

		if (removedItems.length > 0) {
			this.internalItems.splice(0, this.internalItems.length);
			for (const item of remainingItems) {
				this.internalItems.push(item);
			}
			this.notify({ index: 0, removedItems: removedItems }, "removeAll");
		}

		return removedItems;
	}

	public slice(start: number, count?: number) {
		const result = new ObservableArray(this.value.slice(start, count));
		this.subscribe((value, action) => {
			result.splice(0, result.length, ...this.value.slice(start, count));
		});
		return result;
	}

	public sort(comparer: (a: T, b: T) => number) {
		this.value.sort(comparer);
		this.notify({ index: 0 }, "sort");
	}

	public splice(start: number, deleteCount: number, ...itemsToAdd: T[]): T[] {
		const removedItems = this.internalItems.splice(start, deleteCount, ...itemsToAdd);
		this.notify({ addedItems: itemsToAdd, index: start, removedItems: removedItems }, "splice");

		return removedItems;
	}

	public unshift(...items: T[]): T[] {
		return this.splice(0, 0, ...items);
	}

	public get value(): T[] {
		return this.internalItems;
	}

	public set value(items: T[]) {
		// Preserve the original array, but avoid the "..." arguments issue with splice/push
		let removedItems: T[];
		if (items === this.internalItems) {
			// Special case for someone passing us the same internal array that we are already using
			// We don't need to modify the internalItems. The "removedItems" in the event is
			// not going to be accurate in the case that someone modified this internal array
			// outside of the observable -- we won't know the prior state in that case.
			removedItems = this.internalItems;
		} else {
			// Clear out the existing items
			removedItems = this.internalItems.slice();
			this.internalItems.length = 0;

			// Add all new items
			if (items.length) {
				for (const item of items) {
					this.internalItems.push(item);
				}
			}
		}
		this.notify({ addedItems: items, index: 0, removedItems: removedItems }, "splice");
	}
}

/**
 * An Observable collection is used to track a set of objects by name and offer notifications
 * for consumers when the collection has changed.
 *
 * EventTypes:
 *  add - ICollectionEvent<V>
 */
export interface IObservableObject<V> extends IObservable<IObjectProperty<V>> {
	/**
	 * Adding an object to the collection will notify all observers of the collection
	 * and keep track of the objects.
	 *
	 * @param objectName - name of the object be registered.
	 *
	 * @param objectDefinition - details of the object being registered
	 */
	add: (objectName: string, objectDefinition: V) => void;

	/**
	 * Deletes an object from the collection with the given key/objectName
	 *
	 * @param objectName - name of the object to delete
	 */
	delete: (objectName: string) => void;

	/**
	 * get is used to retrieve the objectDefinition for named object.
	 *
	 * @param objectName - name of the object to get the definition.
	 */
	get: (objectName: string) => V | undefined;

	/**
	 * Adds an object to the collection, overwriting the old
	 *
	 * @param objectName - name of the object be registered.
	 *
	 * @param objectDefinition - details of the object being registered
	 */
	set: (objectName: string, objectDefinition: V) => void;

	/**
	 * A read-only collection of the existing objects.
	 */
	keys: () => IReadonlyObservableArray<string>;
}

/**
 * An ObservableObject can be used to key a named collection of properties
 * and offer an observable endpoint.
 */
export class ObservableObject<V> extends Observable<IObjectProperty<V>> implements IObservableObject<V> {
	private objects: { [objectName: string]: V } = {};
	private keyCache: IObservableArray<string> = new ObservableArray<string>();

	public add(objectName: string, objectDefinition: V): void {
		if (!this.objects.hasOwnProperty(objectName)) {
			this.objects[objectName] = objectDefinition;
			this.keyCache.push(objectName);
			this.notify({ key: objectName, value: objectDefinition }, "add");
		}
	}

	public delete(objectName: string): void {
		if (this.objects.hasOwnProperty(objectName)) {
			const objectDefinition = this.objects[objectName];
			delete this.objects[objectName];
			const keyIndex = this.keyCache.value.indexOf(objectName);
			if (keyIndex >= 0) {
				this.keyCache.splice(keyIndex, 1);
			}
			this.notify({ key: objectName, value: objectDefinition }, "delete");
		}
	}

	public get(objectName: string): V | undefined {
		return this.objects[objectName];
	}

	public set(objectName: string, objectDefinition: V): void {
		if (this.objects.hasOwnProperty(objectName)) {
			this.objects[objectName] = objectDefinition;
			this.notify({ key: objectName, value: objectDefinition }, "replace");
		} else {
			this.add(objectName, objectDefinition);
		}
	}

	public keys(): IReadonlyObservableArray<string> {
		return this.keyCache;
	}
}

/**
 * Indicates an object that has a ready property to let consumers know when the object is ready.
 */
export interface IReadyable {
	/**
	 * An observable which lets the consumer know when the object is ready
	 */
	ready: IObservableValue<boolean>;
}

/**
 * Indicates an object that has a ready property to let consumers know when the object is ready.
 */
export interface IReadonlyReadyable {
	/**
	 * An observable which lets the consumer know when the object is ready
	 */
	ready: IReadonlyObservableValue<boolean>;
}

/**
 * An observable value which lets consumers know when its initial items have been populated and it is ready to use.
 */
export interface IReadyableObservableValue<T> extends IObservableValue<T>, IReadyable {}

/**
 * An observable value which lets consumers know when its initial items have been populated and it is ready to use.
 */
export interface IReadyableReadonlyObservableValue<T> extends IReadonlyObservableValue<T>, IReadyable {}

export class ReadyableObservableValue<T> extends ObservableValue<T> implements IReadyableObservableValue<T> {
	public readonly ready: ObservableValue<boolean>;
	constructor(value: T, ready = false) {
		super(value);
		this.ready = new ObservableValue(ready);
	}
}

/**
 * An observable array which lets consumers know when its initial items have been populated and it is ready to use.
 */
export interface IReadyableReadonlyObservableArray<T> extends IReadonlyObservableArray<T>, IReadonlyReadyable {}

/**
 * An observable array which lets consumers know when its initial items have been populated and it is ready to use.
 */
export interface IReadyableObservableArray<T> extends IObservableArray<T>, IReadyable {}

export class ReadyableObservableArray<T> extends ObservableArray<T> implements IReadyableObservableArray<T> {
	public readonly ready: ObservableValue<boolean>;
	constructor(items: T[] = [], ready = false) {
		super(items);
		this.ready = new ObservableValue(ready);
	}
}

/**
 * React Hooks extension that allows the consumer to track Observables with a useState like
 * hooks API.
 *
 * @param initialState Initial value for the state, or a function that will resolve the value
 * the when the value is initialized.
 */
export function useObservable<T>(
	initialState: T | (() => T)
): [ObservableValue<T>, React.Dispatch<React.SetStateAction<T>>] {
	const [underlyingState] = React.useState<T>(initialState);

	const reactState = React.useState<ObservableValue<T>>(new ObservableValue<T>(underlyingState));
	const updateState = (updatedState: T | ((prevState: T) => T)) => {
		if (typeof updatedState === "function") {
			reactState[0].value = (updatedState as (prevState: T) => T)(reactState[0].value);
		} else {
			reactState[0].value = updatedState;
		}
	};

	return [reactState[0], updateState];
}

/**
 * React Hooks extension that allows the consmer to track ObservableArrays with a useState like
 * hooks API.
 *
 * @param initialState Initial value for the state, or a function that will resolve the value
 * the when the value is initialized.
 */
export function useObservableArray<T>(
	initialState: T[] | (() => T[])
): [IObservableArray<T>, React.Dispatch<React.SetStateAction<T[]>>] {
	const [underlyingState] = React.useState<T[]>(initialState);

	const reactState = React.useState<ObservableArray<T>>(new ObservableArray<T>(underlyingState));
	const updateState = (updatedState: T[] | ((prevState: T[]) => T[])) => {
		if (typeof updatedState === "function") {
			reactState[0].value = (updatedState as (prevState: T[]) => T[])(reactState[0].value);
		} else {
			reactState[0].value = updatedState;
		}
	};

	return [reactState[0], updateState];
}

// Returns a new type that is a copy of T, but with all keys from
// TObservableKeys being IObservable
export type ObservableObjectValues<T, TObservableKeys extends keyof T> = {
	[P in keyof T]: P extends TObservableKeys ? IObservableValue<T[P]> : T[P]
};
