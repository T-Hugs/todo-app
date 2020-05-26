export interface IToDoItem {
	id: number;
	action: string;
	priority: number;
	dateCreated: Date;
	dateCompleted: Date | null;
}
