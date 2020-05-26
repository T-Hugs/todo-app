import React from "react";
import { ToDoItem } from "./ToDoItem";
import { useToDoContext } from "./ToDoContext";
import { useForceUpdate } from "../Util";
import { useStatsContext } from "../AppStats";
export const ToDoList: React.FunctionComponent<{
	showCompletedItemsLast: boolean;
}> = ({ showCompletedItemsLast }) => {
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
		return <ToDoItem isFirst={isFirst} isLast={isLast} key={todo.id + todo.action} itemId={todo.id} />;
	});

	const forceUpdate = useForceUpdate();
	React.useEffect(() => {
		store.on(["additem", "deleteitem", "moveitem"], forceUpdate);
		store.on(["changeitem"], () => {
			if (showCompletedItemsLast) {
				forceUpdate();
			}
		});
	}, [store, forceUpdate, showCompletedItemsLast]);

	return <div className="to-do-list">{items}</div>;
};
