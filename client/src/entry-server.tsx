import { renderToString } from "react-dom/server";
import { Router } from "wouter";
import App from "./App";

/**
 * Server-side render function for SSR
 * @param url - The requested URL for routing
 * @returns Rendered HTML string
 */
export function render(url: string): string {
  // Note: For production, consider using renderToPipeableStream for streaming SSR
  // This is a simpler implementation using renderToString
  // Wrap App in Router with ssrPath to ensure route-aware rendering
  const html = renderToString(
    <Router ssrPath={url}>
      <App />
    </Router>
  );
  return html;
}
