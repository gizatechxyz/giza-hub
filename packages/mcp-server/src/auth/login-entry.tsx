import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginPage } from './login-page.js';

const config = window.__GIZA_LOGIN_CONFIG__;
const container = document.getElementById('root');

if (container && config?.appId) {
  const root = createRoot(container);
  root.render(<LoginPage appId={config.appId} />);
}
