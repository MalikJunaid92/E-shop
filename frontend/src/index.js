import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Provider } from "react-redux";
import Store from "./redux/store";
import axios from "axios";
axios.defaults.withCredentials = true;
// If a token was saved during login (fallback for when cookies are rejected),
// set the Authorization header on startup so subsequent requests include it.
try {
  const savedToken =
    localStorage.getItem("seller_token") || localStorage.getItem("token");
  if (savedToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
  }
} catch (err) {
  // ignore localStorage errors (e.g., in some browsers/environments)
}

ReactDOM.render(
  <Provider store={Store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

reportWebVitals();
