import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DevDataToggle } from './components/DevDataToggle';
import { StoreProvider } from './store';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
      {import.meta.env.DEV && <DevDataToggle />}
    </StoreProvider>
  </StrictMode>,
);
