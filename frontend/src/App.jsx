import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router/AppRouter';

export function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <AppRouter />
      </div>
    </BrowserRouter>
  );
}

export default App;
