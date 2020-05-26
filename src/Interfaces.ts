import { ObservableObjectValues } from "./observable/Observable";

export interface IToDoItem {
	id: number;
	action: string;
	priority: number;
	completed: boolean;
	dateCreated: Date;
	dateCompleted: Date | null;
}

export type ObservableToDoItem = ObservableObjectValues<
	IToDoItem,
	"action" | "priority" | "completed" | "dateCompleted"
>;
