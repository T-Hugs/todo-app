import { _getTestDate } from "../Util";
import { IToDoItem } from "../Interfaces";
import { types, destroy, Instance, getRoot } from "mobx-state-tree";

const before1 = _getTestDate();
const before2 = _getTestDate();
const DEFAULT_TODOS: IToDoItem[] = [
	{
		id: 0,
		action: "Something I really gotta do",
		priority: 1,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 1,
		action: "Something I probably should do",
		priority: 4,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 2,
		action: "Something I might wanna do",
		priority: 5,
		dateCreated: _getTestDate(),
		dateCompleted: null,
	},
	{
		id: 3,
		action: "Something I already did!",
		priority: 2,
		dateCreated: before1,
		dateCompleted: _getTestDate(before1),
	},
	{
		id: 4,
		action: "Something I decided not to do",
		priority: 3,
		dateCreated: before2,
		dateCompleted: _getTestDate(before2),
	},
];

export const ToDo = types
	.model({
		id: types.identifierNumber,
		action: types.string,
		priority: types.number,
		dateCreated: types.Date,
		dateCompleted: types.optional(types.maybeNull(types.Date), null),
	})
	.views(self => ({
		get completed() {
			return self.dateCompleted !== null;
		},
	}))
	.actions(self => ({
		setAction(newAction: string) {
			self.action = newAction;
		},
		setPriority(newPriority: number) {
			self.priority = newPriority;
		},
		toggleItemCompleted() {
			if (self.completed) {
				self.dateCompleted = null;
			} else {
				self.dateCompleted = new Date();
			}
		},
		remove() {
			// How can I avoid the type assertion?
			getRoot<typeof ToDoStore>(self).deleteItem(self as Instance<typeof ToDo>);
		},
		move(distance: number) {
			// How can I avoid the type assertion?
			getRoot<typeof ToDoStore>(self).move(self as Instance<typeof ToDo>, distance);
		},
	}));

export interface GetItemsSettings {
	completedItemsLast?: boolean;
	count?: number;
	filter?: (item: Instance<typeof ToDo>) => boolean;
}

export const ToDoStore = types
	.model({
		toDos: types.array(ToDo),
		nextId: 0,
		highestPriority: 0,
	})
	.views(self => ({
		items(settings: GetItemsSettings = {}) {
			const toDos = Array.from(self.toDos);
			toDos.sort((a, b) => {
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
			let filtered = toDos;
			if (settings.filter) {
				filtered = filtered.filter(settings.filter);
			}
			if (typeof settings.count === "number") {
				filtered = filtered.slice(0, settings.count);
			}
			return filtered;
		},
		byId(id: number) {
			return self.toDos.find(i => i.id === id);
		},
	}))
	.actions(self => ({
		addItem(action: string) {
			const id = self.nextId++;
			self.toDos.push({
				id,
				action,
				priority: self.highestPriority,
				completed: false,
				dateCreated: new Date(),
				dateCompleted: null,
			});
		},
		deleteItem(toDo: Instance<typeof ToDo>) {
			destroy(toDo);
		},
		deleteAllCompleted() {
			self.toDos.replace(self.toDos.filter(toDo => !toDo.completed));
		},
		move(toDo: Instance<typeof ToDo>, distance: number) {
			const oldOrder = self.items({ completedItemsLast: false });
			const index = oldOrder.findIndex(i => i.id === toDo.id);
			oldOrder.splice(index, 1);
			oldOrder.splice(index + distance, 0, self.toDos.find(t => t.id === toDo.id));
			let i = 0;
			for (const item of oldOrder) {
				item.priority = i++;
			}
		},
	}));

export const ToDos = ToDoStore.create({ toDos: [] });
for (const toDo of DEFAULT_TODOS) {
	ToDos.addItem(toDo.action);
	if (toDo.dateCompleted) {
		ToDos.byId(toDo.id).toggleItemCompleted();
	}
}
