import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

// In production, we load the built SSR bundle
// In development, we'll use Vite's dev server (no SSR in dev mode)
let ssrManifest: any = null;
let template: string = '';
let render: ((url: string) => string) | null = null;

/**
 * Initialize the SSR renderer
 * This should be called once during server startup
 */
export async function initRenderer() {
  if (isProduction) {
    // Load the HTML template
    const templatePath = path.resolve(__dirname, '../dist/public/index.html');
    template = fs.readFileSync(templatePath, 'utf-8');
    
    // For production SSR: ensure the template uses entry-client for hydration
    // The build process outputs hashed bundle names, so we don't need to modify script tags
    
    // Load the SSR manifest
    const manifestPath = path.resolve(__dirname, '../dist/public/.vite/manifest.json');
    if (fs.existsSync(manifestPath)) {
      ssrManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    }
    
    // Import the SSR bundle
    const entryServer = await import('../dist/server/entry-server.js');
    render = entryServer.render;
    
    console.log('✅ SSR renderer initialized in production mode');
  } else {
    console.log('⚠️  SSR disabled in development mode - using client-side rendering');
  }
}

/**
 * Render a page to HTML string
 * @param url - The requested URL
 * @returns Rendered HTML or null if SSR is not available
 */
export async function renderPage(url: string): Promise<string | null> {
  if (!isProduction || !render || !template) {
    return null; // SSR not available in dev mode
  }
  
  try {
    // Render the app to HTML
    const appHtml = render(url);
    
    // Inject the rendered HTML into the template
    // Look for the root div and replace it with server-rendered content
    const html = template.replace(
      '<div id="root"></div>',
      `<div id="root">${appHtml}</div>`
    );
    
    return html;
  } catch (error) {
    console.error('SSR rendering error:', error);
    // Return null to fall back to client-side rendering
    return null;
  }
}

/**
 * Check if SSR is enabled and ready
 */
export function isSSREnabled(): boolean {
  return isProduction && render !== null;
}
