import '@expo/metro-runtime';

import React from 'react';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app'); //Path with src folder

  return React.createElement(ExpoRoot, { context: ctx });
}

registerRootComponent(App);
