import { hydrateRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors in Replit environment
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('WebSocket') || 
      event.reason?.message?.includes('localhost:undefined')) {
    event.preventDefault();
  }
});

// Hydrate the server-rendered HTML
// Wrap in Router to match server-side structure
hydrateRoot(document.getElementById("root")!, (
  <Router>
    <App />
  </Router>
));
