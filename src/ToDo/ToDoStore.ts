import { _getTestDate } from "../Util";
import { IToDoItem } from "../Interfaces";
import { action, observable, runInAction } from "mobx";

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

export interface GetItemsSettings {
	completedItemsLast?: boolean;
	count?: number;
	filter?: (item: IToDoItem) => boolean;
}

export class ToDoStore {
	// higher number = lower priority
	private nextId: number = DEFAULT_TODOS.length;
	private highestPriority: number = DEFAULT_TODOS.length;
	@observable private todos: Map<number, IToDoItem> = new Map<number, IToDoItem>();

	constructor() {
		runInAction(() => {
			for (const item of DEFAULT_TODOS) {
				this.todos.set(item.id, item);
			}
		});
	}

	@action
	public addItem(str: string) {
		const toDo = {
			id: this.nextId++,
			action: str,
			priority: this.highestPriority++,
			completed: false,
			dateCreated: new Date(),
			dateCompleted: null,
		};
		this.todos.set(toDo.id, toDo);
	}

	@action
	public deleteItems(idOrIds: number | number[]) {
		let ids = typeof idOrIds === "number" ? [idOrIds] : idOrIds;

		for (const id of ids) {
			this.todos.delete(id);
		}
	}

	public deleteAllCompleted() {
		this.deleteItems(
			Array.from(this.todos.values())
				.filter(v => v.completed)
				.map(v => v.id)
		);
	}

	@action
	public setAction(id: number, action: string) {
		this.todos.get(id).action = action;
	}

	@action
	public toggleItemCompleted(item: IToDoItem) {
		item.completed = !item.completed;
		if (item.completed) {
			item.dateCompleted = new Date();
		}
	}

	public getItems(settings: GetItemsSettings = {}) {
		const todos = Array.from(this.todos.values());
		todos.sort((a, b) => {
			if (settings.completedItemsLast) {
				if (a.completed && !b.completed) {
					return 1;
				}
				if (!a.completed && b.completed) {
					return -1;
				}
			}
			return a.priority - b.priority;
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
		return this.todos.get(id);
	}

	@action
	public move(id: number, distance: number) {
		const oldOrder = this.getItems({ completedItemsLast: false });
		const index = oldOrder.findIndex(i => i.id === id);
		oldOrder.splice(index, 1);
		oldOrder.splice(index + distance, 0, this.todos.get(id));
		let i = 0;
		for (const item of oldOrder) {
			item.priority = i++;
		}
	}
}
