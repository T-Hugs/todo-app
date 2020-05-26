import React from "react";
import { ToDoStore } from "./ToDoStore";

const ToDoContext = React.createContext({ store: ToDoStore.create() });

export const ToDoContextProvider = ToDoContext.Provider;

export function useToDoContext() {
	return React.useContext(ToDoContext);
}
