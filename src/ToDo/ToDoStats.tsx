import React from "react";
import { useToDoContext } from "./ToDoContext";
import { useStatsContext } from "../AppStats";
import { durationToWords } from "../Util";

const Top3ToDo: React.FunctionComponent<{}> = () => {
	const stats = useStatsContext();
	stats.store.signalRender("Top3ToDo");

	const { store } = useToDoContext();
	const toDoItems = store.getItems({ count: 3, filter: item => !item.completed });
	const tasksList = toDoItems.map(item => <li key={item.id}>{item.action}</li>);

	const taskVerbiage =
		tasksList.length === 0 ? "No tasks" : tasksList.length === 1 ? "Top task" : `Top ${tasksList.length} tasks`;

	return (
		<div className="to-do-top-3">
			<h3>{taskVerbiage}</h3>
			<ul>{tasksList}</ul>
		</div>
	);
};

export const AvgCompletionTime: React.FunctionComponent<{}> = () => {
	const stats = useStatsContext();
	stats.store.signalRender("AvgCompletionTime");

	const { store } = useToDoContext();
	const completedItems = store.getItems({ filter: i => i.completed });
	const avgTime =
		completedItems.reduce<number>((p, c) => c.dateCompleted.getTime() - c.dateCreated.getTime(), 0) /
		completedItems.length;

	return (
		completedItems.length > 0 && (
			<div className="avg-completion-time">
				<h3>Average completion time</h3>
				<span className="avg-completion-time-value">{durationToWords(avgTime)}</span>
			</div>
		)
	);
};

export const ToDoStats: React.FunctionComponent<{}> = () => {
	const stats = useStatsContext();
	stats.store.signalRender("ToDoStats");

	const { store } = useToDoContext();
	const allTasks = store.getItems();
	const taskCount = allTasks.length;
	const completedTasks = allTasks.filter(t => t.completed).length;

	return (
		<div className="to-do-stats">
			<Top3ToDo />
			<span>
				{taskCount} total tasks ({completedTasks} completed)
			</span>
			<AvgCompletionTime />
		</div>
	);
};
