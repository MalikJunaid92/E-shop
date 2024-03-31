import React from 'react';
import { createRoot } from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Provider } from 'react-redux';
import Store from './redux/store';
createRoot(document.getElementById('root')).render(
  <Provider store={Store}>
    <App />
  </Provider>
);


reportWebVitals();
