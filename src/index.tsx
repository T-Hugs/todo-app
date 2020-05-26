import React from "react";
import ReactDOM from "react-dom";
import "mobx-react-lite/batchingForReactDom";
import { configure } from "mobx";

import App from "./App";

configure({ enforceActions: "always" });

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
