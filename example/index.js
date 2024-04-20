import React from 'react';
import { registerRootComponent } from 'expo';

import App from './src/App';

registerRootComponent(() => (
  <React.StrictMode>
    <App />
  </React.StrictMode>
));
