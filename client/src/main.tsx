import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors in Replit environment
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') || 
      event.reason?.message?.includes('localhost:undefined')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
