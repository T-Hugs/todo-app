import React from "react";
import { ToDoItem } from "./ToDoItem";
import { useToDoContext } from "./ToDoContext";
import { useStatsContext } from "../AppStats";
import { observer } from "mobx-react-lite";
export const ToDoList: React.FunctionComponent<{
	showCompletedItemsLast: boolean;
}> = observer(({ showCompletedItemsLast }) => {
	const stats = useStatsContext();
	stats.store.signalRender("ToDoList");
	const { store } = useToDoContext();

	let seenCompletedItem = false;
	const items = store.getItems({ completedItemsLast: showCompletedItemsLast }).map((todo, index, items) => {
		let isFirst = index === 0;
		let isLast = index === items.length - 1;
		if (showCompletedItemsLast) {
			if (!seenCompletedItem && todo.completed) {
				isFirst = true;
				seenCompletedItem = true;
			}
			const nextItem = items[index + 1];
			if (nextItem && nextItem.completed && !todo.completed) {
				isLast = true;
			}
		}
		return <ToDoItem isFirst={isFirst} isLast={isLast} key={todo.id} itemId={todo.id} />;
	});

	return <div className="to-do-list">{items}</div>;
});
