import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely catch & suppress benign WebSocket disconnects, HMR reconnects, and aborted fetch signals
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const reasonStr = typeof reason === 'string' 
      ? reason 
      : (reason?.message || reason?.name || String(reason || ''));

    if (
      reasonStr.includes('websocket') ||
      reasonStr.includes('WebSocket') ||
      reasonStr.includes('ws://') ||
      reasonStr.includes('wss://') ||
      reasonStr.includes('AbortError') ||
      reasonStr.includes('aborted') ||
      reasonStr.includes('vite') ||
      reasonStr.includes('socket') ||
      reasonStr.includes('NetworkError')
    ) {
      event.preventDefault(); // Prevents unhandled rejection from crashing or polluting the console/UI
      return;
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') ||
      msg.includes('websocket') ||
      msg.includes('ws://') ||
      msg.includes('wss://')
    ) {
      event.preventDefault();
      return;
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

