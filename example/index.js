import App from './src/App';
import React from 'react';
import { registerRootComponent } from 'expo';

registerRootComponent(() => (
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
