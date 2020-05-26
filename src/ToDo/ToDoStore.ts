import { _getTestDate } from "../Util";
import { IToDoItem, ObservableToDoItem } from "../Interfaces";
import { ObservableValue, ObservableObject, ObservableArray, IObservableArray } from "../observable/Observable";

const before1 = _getTestDate();
const before2 = _getTestDate();
const DEFAULT_TODOS: IToDoItem[] = [
	{
		id: 0,
		action: "Something I really gotta do",
		priority: 1,
		completed: false,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 1,
		action: "Something I probably should do",
		priority: 4,
		completed: false,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 2,
		action: "Something I might wanna do",
		priority: 5,
		completed: false,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 3,
		action: "Something I already did!",
		priority: 2,
		completed: true,
		dateCreated: before1,
		dateCompleted: _getTestDate(before1),
	},
	{
		id: 4,
		action: "Something I decided not to do",
		priority: 3,
		completed: true,
		dateCreated: before2,
		dateCompleted: _getTestDate(before2),
	},
];

function createItem(itemSpec: IToDoItem): ObservableToDoItem {
	return {
		id: itemSpec.id,
		action: new ObservableValue(itemSpec.action),
		priority: new ObservableValue(itemSpec.priority),
		completed: new ObservableValue(itemSpec.completed),
		dateCreated: itemSpec.dateCreated,
		dateCompleted: new ObservableValue(itemSpec.dateCompleted),
	};
}

export interface GetItemsSettings {
	completedItemsLast?: boolean;
	count?: number;
	filter?: (item: ObservableToDoItem) => boolean;
}

export class ToDoStore {
	// higher number = lower priority
	private nextId: number = DEFAULT_TODOS.length;
	private highestPriority: number = DEFAULT_TODOS.length;
	private toDos: ObservableObject<ObservableToDoItem>;

	constructor() {
		this.toDos = new ObservableObject<ObservableToDoItem>();
		for (const item of DEFAULT_TODOS) {
			this.toDos.set(String(item.id), createItem(item));
		}
	}

	public addItem(str) {
		const toDo = createItem({
			id: this.nextId++,
			action: str,
			priority: this.highestPriority++,
			completed: false,
			dateCreated: new Date(),
			dateCompleted: null,
		});
		this.toDos.set(String(toDo.id), toDo);
	}

	public deleteItems(idOrIds: number | number[]) {
		let ids = typeof idOrIds === "number" ? [idOrIds] : idOrIds;

		for (const id of ids) {
			this.toDos.delete(String(id));
		}
	}

	public deleteAllCompleted() {
		const keys = this.toDos.keys();
		const toDelete: number[] = [];
		for (const k of keys.value) {
			const toDo = this.toDos.get(k);
			if (toDo.completed) {
				toDelete.push(toDo.id);
			}
		}
		this.deleteItems(toDelete);
	}

	public setAction(id: number, action: string) {
		this.toDos.get(String(id)).action.value = action;
	}

	public toggleItemCompleted(item: ObservableToDoItem) {
		item.completed.value = !item.completed.value;
		if (item.completed) {
			item.dateCompleted.value = new Date();
		}
	}

	public getItems(settings: GetItemsSettings = {}) {
		const todos: IObservableArray<ObservableToDoItem> = this.toDos.keys().map(k => this.toDos.get(k));
		todos.sort((a, b) => {
			if (settings.completedItemsLast) {
				if (a.completed.value && !b.completed.value) {
					return 1;
				}
				if (!a.completed.value && b.completed.value) {
					return -1;
				}
			}
			return a.priority.value - b.priority.value;
		});
		let filtered = todos;
		if (settings.filter) {
			filtered = filtered.filter(settings.filter);
		}
		if (typeof settings.count === "number") {
			filtered = filtered.slice(0, settings.count);
		}
		return filtered;
	}

	public getItem(id: number) {
		return this.toDos.get(String(id));
	}

	public move(id: number, distance: number) {
		const oldOrder = this.getItems({ completedItemsLast: false });
		const index = oldOrder.value.findIndex(i => i.id === id);
		oldOrder.splice(index, 1);
		oldOrder.splice(index + distance, 0, this.toDos.get(String(id)));
		let i = 0;
		for (const item of oldOrder.value) {
			item.priority.value = i++;
		}
	}
}
