import React from "react";
import { useForceUpdate } from "./Util";
import { useStatsContext } from "./AppStats";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addLocale(en);
const timeAgo = new TimeAgo("en-US");

export const LiveAgo: React.FunctionComponent<{ dateTime: Date; refreshInterval?: number }> = ({
	dateTime,
	refreshInterval,
}) => {
	const stats = useStatsContext();
	stats.store.signalRender("LiveAgo");

	const forceUpdate = useForceUpdate();
	const interval = refreshInterval || 5000;
	React.useEffect(() => {
		const intervalHandle = setInterval(forceUpdate, interval);
		return () => {
			clearInterval(intervalHandle);
		};
	});

	const title = dateTime.toISOString();
	const formattedAgo = timeAgo.format(dateTime);
	return (
		<div className="live-ago" title={title}>
			{formattedAgo}
		</div>
	);
};
