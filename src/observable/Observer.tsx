import { IObservableLikeArray, IObservableLikeValue, IObservableValue, ObservableLike } from "./Observable";
import * as React from "react";

export interface IObservableExpression {
	/**
	 * Using an observableExpression you can sign up for an action instead of
	 * all actions which is the default.
	 */
	action?: string;

	/**
	 * filter function that determines whether or not an action should affect
	 * the state of the Observer.
	 *
	 * @param value The observable value that is being supplied for the action.
	 * @param action The action that has taken place.
	 *
	 * @returns true if the Observer should setState, false if the change should
	 * be ignored.
	 */
	filter?: (value: any, action: string) => boolean;

	/**
	 * The observableValue is the value being observed. When actions are fired,
	 * the filter is called and the results determine whether the component
	 * changes state.
	 */
	observableValue: IObservableLikeValue<any>;
}

/**
 * Represents the type of the underlying Observable
 */
type UnpackObservable<T> = T extends IObservableLikeValue<infer Q>
	? Q
	: T extends IObservableLikeArray<infer R>
	? R[]
	: T;

/**
 * A simple dictionary of Observables
 */
interface ObservableBag {
	[key: string]: IObservableLikeValue<any> | IObservableExpression;
}

export interface IObserverProps<T extends ObservableBag> {
	/**
	 * Called whenever componentDidUpdate is run by the Observer
	 * (after subscriptions have been updated).
	 * Useful in situations where you need to be notified when Observer updates
	 * happen, but don't want to insert a new component just for the lifecycle methods.
	 */
	onUpdate?: () => void;

	observed: T;

	/**
	 * Children is a function that receives the values of each of the observables found in T
	 */
	children?: (values: { [propName in keyof T]: UnpackObservable<T[propName]> }) => React.ReactNode;
}

export interface IObserverState<T extends ObservableBag> {
	/**
	 * Dictionary of underlying observed promise values
	 */
	values: { [propName in keyof T]?: UnpackObservable<T[propName]> };
	oldProps: T;
}

interface ISubscribable<T> {
	subscribe(propName: string, props: T): void;
	unsubscribe(propName: string, props: T): void;
}

interface ISubscription {
	delegate: (value: any, action: string) => void;
	action: string | undefined;
}

/**
 * Handles subscription to properties that are IObservableValues, so that components don't have to handle on their own.
 *
 * Usage:
 *
 * <Observer observed={{myObservableValue: observableValue}} className='foo'>
 *     {({myObservableValue}) => {
 *         return <MyComponent myObservableValue={myObservableValue} />
 *     }}
 * </Observer>
 *
 * Your component will get re-rendered with the new value of myObservableValue whenever that value changes.
 * Additionally, any additional props set on the Observer will also get passed down.
 */
export class Observer<T> extends React.Component<IObserverProps<T>, IObserverState<T>> {
	public static getDerivedStateFromProps<T>(
		props: Readonly<IObserverProps<T>>,
		state: Readonly<IObserverState<T>>
	): Partial<IObserverState<T>> {
		const newState = updateSubscriptionsAndState(state.oldProps, props.observed, state);
		if (newState != null) {
			return { ...newState, oldProps: props.observed };
		}
		return { oldProps: props.observed };
	}

	private subscribedProps: T = {} as T;
	private subscriptions: { [propName in keyof T]?: ISubscription };

	constructor(props: Readonly<IObserverProps<T>>) {
		super(props);

		this.subscriptions = {};

		// Initialize the state with the initial value of the observable.
		const state: IObserverState<T> = { values: {}, oldProps: {} as T };
		for (const propName in props.observed) {
			state.values[propName] = getPropValue(props.observed[propName as keyof T]);
		}

		this.state = state;
	}

	public render(): React.ReactNode {
		const observedValues: { [propName in keyof T]?: UnpackObservable<T[propName]> } = {};

		// Copy over any properties from the observable component to the children.
		for (const key in this.state.values) {
			if (key !== "children") {
				observedValues[key] = this.state.values[key];
			}
		}

		if (typeof this.props.children === "function") {
			const child = this.props.children;
			return child(observedValues as { [propName in keyof T]: UnpackObservable<T[propName]> });
		} else {
			const child = React.Children.only(this.props.children as JSX.Element) as React.DetailedReactHTMLElement<
				any,
				HTMLElement
			>;
			return React.cloneElement(child, { ...child.props, ...observedValues }, child.props.children);
		}
	}

	public componentDidMount(): void {
		this.updateSubscriptionsAndStateAfterRender();
	}

	public componentDidUpdate(): void {
		this.updateSubscriptionsAndStateAfterRender();

		if (this.props.onUpdate) {
			this.props.onUpdate();
		}
	}

	public componentWillUnmount(): void {
		// Unsubscribe from any of the observable properties.
		for (const propName in this.subscribedProps) {
			this.unsubscribe(propName, this.subscribedProps);
		}
	}

	public subscribe(propName: keyof T, props: T) {
		if (propName !== "children") {
			let observableExpression: IObservableExpression | undefined;
			let observableValue = props[propName];
			let action: string | undefined;

			// If this is an observableExpression, we need to subscribe to the value
			// and execute the filter on changes.
			if (
				observableValue &&
				((observableValue as unknown) as IObservableExpression).observableValue !== undefined
			) {
				observableExpression = (observableValue as unknown) as IObservableExpression;
				observableValue = observableExpression.observableValue;
				action = observableExpression.action;
			}

			if (ObservableLike.isObservable(observableValue)) {
				const delegate = this.onValueChanged.bind(this, propName, observableValue, observableExpression);
				ObservableLike.subscribe(observableValue, delegate, action);
				this.subscriptions[propName] = { delegate, action };
			}
		}
	}

	public unsubscribe(propName: keyof T, props: T) {
		if (propName !== "children") {
			const observableValue = getObservableValue(props[propName]);

			if (ObservableLike.isObservable(observableValue)) {
				const subscription = this.subscriptions[propName];
				ObservableLike.unsubscribe(observableValue, subscription!.delegate, subscription!.action);
				delete this.subscriptions[propName];
			}
		}
	}

	private updateSubscriptionsAndStateAfterRender() {
		const newState = updateSubscriptionsAndState(
			this.subscribedProps,
			this.props.observed,
			this.state,
			this as ISubscribable<T>
		);
		if (newState != null) {
			this.setState(newState);
		}

		this.subscribedProps = { ...this.props.observed };
	}

	private onValueChanged(
		propName: keyof T,
		observableValue: T[keyof T],
		observableExpression: IObservableExpression | undefined,
		value: any,
		action: string
	) {
		let setState = true;

		if (!(propName in this.subscriptions)) {
			return;
		}

		// If this is an ObservableExpression we will call the filter before setting state.
		if (observableExpression && observableExpression.filter) {
			setState = observableExpression.filter(value, action);
		}
		if (setState) {
			this.setState((prevState: Readonly<IObserverState<T>>) => {
				return {
					values: {
						...prevState.values,
						[propName]: ((observableValue as unknown) as IObservableValue<any>).value || value,
					},
				};
			});
		}
	}
}

function getObservableValue(
	propValue: IObservableValue<any> | IObservableExpression | any
): IObservableValue<any> | any {
	if (propValue && propValue.observableValue !== undefined) {
		return propValue.observableValue;
	}

	return propValue;
}

function getPropValue(propValue: IObservableValue<any> | IObservableExpression | any): any {
	return ObservableLike.getValue(getObservableValue(propValue));
}

function updateSubscriptionsAndState<T>(
	oldProps: T,
	newProps: T,
	state: IObserverState<T>,
	component?: ISubscribable<T>
): IObserverState<T> | null {
	// We need to unsubscribe from any observable values on old props and
	// subscribe to any observable values on new props.
	// In addition, if any of the values of the observables on the new props
	// differ from the value on the state, then we need to update the state.
	// This is possible if the value of the observable changed while the value
	// was being rendered, but before we had set up the subscription.
	// If we want to unsubscribe/resubscribe, then a component should be passed,
	// since this method is always called statically.

	const newState: IObserverState<T> = { ...state };
	let stateChanged = false;
	if (oldProps) {
		for (const propName in oldProps) {
			const oldValue = getObservableValue(oldProps[propName]);
			const newValue = getObservableValue(newProps[propName]);

			if (oldValue !== newValue) {
				component && component.unsubscribe(propName, oldProps);
				if (newValue === undefined) {
					delete newState.values[propName];
					stateChanged = true;
				}
			}
		}
	}

	for (const propName in newProps) {
		const oldValue = oldProps && getObservableValue(oldProps[propName]);
		const newValue = getObservableValue(newProps[propName]);

		if (oldValue !== newValue) {
			component && component.subscribe(propName, newProps);

			// Look for changes in the observables between creation and now.
			if (state.values[propName] !== getPropValue(newValue)) {
				newState.values[propName] = getPropValue(newValue);
				stateChanged = true;
			}
		}
	}

	// If any state updates occurred update the state now.
	if (stateChanged) {
		return newState;
	}

	return null;
}
