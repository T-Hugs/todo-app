export interface IToDoItem {
	id: number;
	action: string;
	priority: number;
	completed: boolean;
	dateCreated: Date;
	dateCompleted: Date | null;
}
