import React from "react";

export function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}

export function _getTestDate(afterDate?: Date) {
	if (afterDate) {
		const now = Date.now();
		return new Date(randomInt(afterDate.getTime(), now));
	} else {
		return new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7));
	}
}

export function useForceUpdate() {
	const setValue = React.useState(0)[1];
	return React.useCallback(() => setValue(value => ++value), [setValue]);
}

export function useButtonTreatment(onActivate: () => void) {
	const onClick = React.useCallback(
		(event: React.MouseEvent) => {
			onActivate();
			event.preventDefault();
		},
		[onActivate]
	);

	const onKeyDown = React.useCallback(
		(event: React.KeyboardEvent) => {
			switch (event.key) {
				case "Enter":
				case " ":
					onActivate();
					event.preventDefault();
			}
		},
		[onActivate]
	);

	return {
		role: "button",
		tabIndex: 0,
		onClick,
		onKeyDown,
	};
}

const timeConstants = [
	{
		name: "day",
		abbr: "d",
		msQty: 86400000,
	},
	{
		name: "hour",
		abbr: "hr",
		msQty: 3600000,
	},
	{
		name: "minute",
		abbr: "min",
		msQty: 60000,
	},
	{
		name: "second",
		abbr: "sec",
		msQty: 1000,
	},
	{
		name: "millisecond",
		abbr: "ms",
		msQty: 1,
	},
];

export function durationToWords(ms: number, graduations = 2) {
	let remainingGraduations = graduations;
	let remainingTime = ms;
	const resultTimeConstantIndexes = [];
	let index = timeConstants.findIndex(tc => tc.msQty < remainingTime);
	if (index < 0) {
		return "0 milliseconds";
	}

	while (remainingGraduations > 0 && index < timeConstants.length) {
		resultTimeConstantIndexes.push(index);
		remainingGraduations--;
		index++;
	}

	if (resultTimeConstantIndexes.length === 1) {
		const tc = timeConstants[resultTimeConstantIndexes[0]];
		return `${Math.round(remainingTime / tc.msQty)} ${tc.name}`;
	}
	let result = [];
	for (const tcIndex of resultTimeConstantIndexes) {
		const tc = timeConstants[tcIndex];
		const ofTc = Math.floor(remainingTime / tc.msQty);
		remainingTime -= ofTc * tc.msQty;
		result.push(`${ofTc} ${tc.abbr}`);
	}
	return result.join(" ");
}
