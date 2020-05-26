import React from "react";
import { useToDoContext } from "./ToDoContext";
import { useStatsContext } from "../AppStats";
export const AddToDoItem: React.FunctionComponent<{}> = () => {
	const stats = useStatsContext();
	stats.store.signalRender("AddToDoItem");

	const { store } = useToDoContext();
	const inputRef = React.useRef<HTMLInputElement>();
	const commitItem = React.useCallback(() => {
		if (inputRef.current) {
			const val = inputRef.current.value;
			if (val) {
				store.addItem(val);
				inputRef.current.value = "";
			}
			inputRef.current.focus();
		}
	}, [store]);

	const onInputKeyDown = React.useCallback(
		(event: React.KeyboardEvent) => {
			switch (event.key) {
				case "Enter":
					commitItem();
					break;
				case "Escape":
					if (inputRef.current) {
						inputRef.current.value = "";
					}
					break;
			}
		},
		[commitItem]
	);

	const onButtonClick = React.useCallback(() => {
		commitItem();
	}, [commitItem]);

	return (
		<div className="add-to-do-item">
			<input ref={inputRef} type="text" placeholder="Add to do item..." onKeyDown={onInputKeyDown} />
			<button onClick={onButtonClick}>
				<span role="img" aria-label="Add item">
					➕
				</span>
			</button>
		</div>
	);
};
