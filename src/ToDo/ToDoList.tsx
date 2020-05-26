import React from "react";
import { ToDoItem } from "./ToDoItem";
import { useToDoContext } from "./ToDoContext";
import { useStatsContext } from "../AppStats";
import { Observer } from "../observable/Observer";
export const ToDoList: React.FunctionComponent<{
	showCompletedItemsLast: boolean;
}> = ({ showCompletedItemsLast }) => {
	const stats = useStatsContext();
	stats.store.signalRender("ToDoList");
	const { store } = useToDoContext();

	let seenCompletedItem = false;
	const items = store.getItems({ completedItemsLast: showCompletedItemsLast });
	const toDoItems = items.map((todo, index, items) => {
		let isFirst = index === 0;
		let isLast = index === items.length - 1;
		if (showCompletedItemsLast) {
			if (!seenCompletedItem && todo.completed.value) {
				isFirst = true;
				seenCompletedItem = true;
			}
			const nextItem = items[index + 1];
			if (nextItem && nextItem.completed.value && !todo.completed.value) {
				isLast = true;
			}
		}
		return <ToDoItem isFirst={isFirst} isLast={isLast} key={todo.id + todo.action.value} itemId={todo.id} />;
	});

	return (
		<div className="to-do-list">
			<Observer observed={{ toDoItems }}>
				{({ toDoItems }) => {
					return toDoItems;
				}}
			</Observer>
		</div>
	);
};
