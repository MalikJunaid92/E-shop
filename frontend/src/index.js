import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import Store from "./redux/store";
import axios from "axios";
axios.defaults.withCredentials = true;

ReactDOM.render(
  <Provider store={Store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

reportWebVitals();
