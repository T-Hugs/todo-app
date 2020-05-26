import React from "react";
import { useForceUpdate } from "./Util";

export class RenderStatsStore {
	private renderCounts: {
		[key: string]: number;
	} = {};
	private onChangeCallbacks: (() => void)[] = [];
	public signalRender(component: string) {
		if (!this.renderCounts[component]) {
			this.renderCounts[component] = 0;
		}
		this.renderCounts[component]++;
		for (const cb of this.onChangeCallbacks) {
			cb();
		}
	}
	public numRenders(component: string) {
		return this.renderCounts[component] || 0;
	}
	public onStatsChange(cb: () => void) {
		this.onChangeCallbacks.push(cb);
	}
}

const StatsContext = React.createContext({ store: new RenderStatsStore() });

export const StatsContextProvider = StatsContext.Provider;

export function useStatsContext() {
	return React.useContext(StatsContext);
}

export const RenderStats: React.FunctionComponent<{}> = () => {
	const { store } = useStatsContext();
	const forceUpdate = useForceUpdate();

	React.useEffect(() => {
		store.onStatsChange(() => {
			forceUpdate();
		});
	}, [store, forceUpdate]);

	return (
		<div className="stats-render-counts">
			<span>Render counts:</span>
			<div className="stats-render-counts-App">App: {store.numRenders("App")}</div>
			<div className="stats-render-counts-ToDoList">ToDoList: {store.numRenders("ToDoList")}</div>
			<div className="stats-render-counts-AddToDoItem">AddToDoItem: {store.numRenders("AddToDoItem")}</div>
			<div className="stats-render-counts-ToDoItem">ToDoItem: {store.numRenders("ToDoItem")}</div>
			<div className="stats-render-counts-LiveAgo">LiveAgo: {store.numRenders("LiveAgo")}</div>
			<div className="stats-render-counts-ToDoStats">ToDoStats: {store.numRenders("ToDoStats")}</div>
			<div className="stats-render-counts-AvgCompletionTime">
				AvgCompletionTime: {store.numRenders("AvgCompletionTime")}
			</div>
			<div className="stats-render-counts-Top3ToDo">Top3ToDo: {store.numRenders("Top3ToDo")}</div>
		</div>
	);
};
