import React from "react";
import classnames from "classnames";
import { useToDoContext } from "./ToDoContext";
import { useButtonTreatment } from "../Util";
import { useStatsContext } from "../AppStats";
import { LiveAgo } from "../LiveAgo";
import { observer } from "mobx-react-lite";
export const ToDoItem: React.FunctionComponent<{
	itemId: number;
	isFirst: boolean;
	isLast: boolean;
}> = observer(({ itemId, isFirst, isLast }) => {
	const stats = useStatsContext();
	stats.store.signalRender("ToDoItem");

	const { store } = useToDoContext();
	const item = store.getItem(itemId);

	const onClick = React.useCallback(
		(event: React.MouseEvent) => {
			if (!event.defaultPrevented) {
				store.toggleItemCompleted(item);
			}
		},
		[store, item]
	);

	const moveUpProps = useButtonTreatment(
		React.useCallback(() => {
			store.move(item.id, -1);
		}, [store, item])
	);

	const moveDownProps = useButtonTreatment(
		React.useCallback(() => {
			store.move(item.id, 1);
		}, [store, item])
	);

	const deleteItemProps = useButtonTreatment(
		React.useCallback(() => {
			store.deleteItems(item.id);
		}, [store, item])
	);

	const inputOnClick = React.useCallback((event: React.MouseEvent) => {
		event.preventDefault();
	}, []);

	const inputOnChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			store.setAction(item.id, event.target.value);
		},
		[store, item]
	);

	const className = classnames("to-do-item", {
		completed: item.completed,
	});

	return (
		<div className={className} onClick={onClick}>
			<div className="to-do-item-mover">
				<span {...moveUpProps} aria-label="Move up" className={isFirst ? "visibility-hidden" : undefined}>
					↑
				</span>
				<span {...moveDownProps} aria-label="Move down" className={isLast ? "visibility-hidden" : undefined}>
					↓
				</span>
			</div>
			<input type="checkbox" checked={item.completed} readOnly />
			<div className="to-do-item-text">
				<input
					onChange={inputOnChange}
					onClick={inputOnClick}
					type="text"
					className="to-do-item-input"
					value={item.action}
				/>
			</div>
			<div className="to-do-item-date">
				<LiveAgo dateTime={item.completed ? item.dateCompleted : item.dateCreated} />
			</div>
			<div className="to-do-item-delete">
				<span {...deleteItemProps} aria-label="delete item">
					✕
				</span>
			</div>
		</div>
	);
});
