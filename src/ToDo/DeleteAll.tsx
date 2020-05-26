import React from "react";
import { useToDoContext } from "./ToDoContext";
import { useStatsContext } from "../AppStats";

export const DeleteAllItems: React.FunctionComponent<{}> = () => {
	const stats = useStatsContext();
	stats.store.signalRender("DeleteAllItems");

	const { store } = useToDoContext();
	const deleteAllClicked = React.useCallback(
		(event: React.MouseEvent) => {
			store.deleteAllCompleted();
		},
		[store]
	);

	return (
		<div className="delete-all">
			<button className="delete-all-button" onClick={deleteAllClicked}>
				Delete All Completed Items
			</button>
		</div>
	);
};
