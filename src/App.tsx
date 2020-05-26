import React from "react";
import "./styles.scss";
import { ToDoList } from "./ToDo/ToDoList";
import { AddToDoItem } from "./ToDo/AddToDoItem";
import { ToDoStore } from "./ToDo/ToDoStore";
import { RenderStatsStore, RenderStats, StatsContextProvider } from "./AppStats";
import { ToDoContextProvider } from "./ToDo/ToDoContext";
import { DeleteAllItems } from "./ToDo/DeleteAll";
import { ToDoStats } from "./ToDo/ToDoStats";

// Problem: store owns state, so App doesn't know when to re-render.
// Solution 1:
export default function App() {
	const [completedItemsLast, setCompletedItemsLast] = React.useState(false);
	const setCompletedItemsLastChange = React.useCallback(
		(event: React.ChangeEvent) => {
			setCompletedItemsLast((event.target as HTMLInputElement).checked);
		},
		[setCompletedItemsLast]
	);
	const storeRef = React.useRef(new ToDoStore());
	const store = storeRef.current;

	const renderStatsRef = React.useRef({ store: new RenderStatsStore() });
	const renderStats = renderStatsRef.current;

	renderStats.store.signalRender("App");

	return (
		<StatsContextProvider value={renderStats}>
			<ToDoContextProvider value={{ store }}>
				<div className="App">
					<header>Header</header>
					<nav>
						<h2>Stats</h2>
						<ToDoStats />
					</nav>
					<main>
						<h1>A Wonderful List</h1>
						<div className="to-do-settings">
							<label>
								<input
									type="checkbox"
									checked={completedItemsLast}
									onChange={setCompletedItemsLastChange}
								/>
								Show completed items last
							</label>
						</div>
						<ToDoList showCompletedItemsLast={completedItemsLast} />
						<AddToDoItem />
						<DeleteAllItems />
					</main>
					<footer>
						<RenderStats />
					</footer>
				</div>
			</ToDoContextProvider>
		</StatsContextProvider>
	);
}
