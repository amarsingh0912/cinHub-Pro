import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { log as logWithTimestamp } from "./utils/logger.js";

export function log(message: string, source = "express") {
  logWithTimestamp(message, source);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    configFile: path.resolve(import.meta.dirname, "../vite.config.ts"),
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/entry-client.tsx"`,
        `src="/src/entry-client.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      console.error('[ERROR]', e);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

/**
 * Serve the app with SSR in production
 * This handles both static assets and server-side rendered HTML
 */
export async function serveSSR(app: Express) {
  // In production, the bundled code runs from dist/index.js
  // So the public directory is at ./public relative to dist
  const distPath = path.resolve(import.meta.dirname, "./public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Import the renderer module
  const { initRenderer, renderPage, isSSREnabled } = await import('./renderer.js');
  
  // Initialize the SSR renderer
  await initRenderer();

  // Serve static client assets with caching
  app.use(express.static(distPath, {
    maxAge: '1y',
    immutable: true,
    index: false, // Don't serve index.html automatically
  }));

  // SSR catch-all route for all non-API requests
  app.use("*", async (req, res, next) => {
    try {
      // Check if SSR is enabled
      if (!isSSREnabled()) {
        // Fall back to static index.html if SSR is disabled
        return res.sendFile(path.resolve(distPath, "index.html"));
      }

      // Render the page with SSR
      const html = await renderPage(req.originalUrl);
      
      if (html) {
        // Successfully rendered with SSR
        res.status(200)
          .set({ 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache', // Disable caching for HTML to ensure fresh content
          })
          .end(html);
      } else {
        // SSR failed, fall back to static HTML
        res.sendFile(path.resolve(distPath, "index.html"));
      }
    } catch (error) {
      const { error: logError } = await import('./utils/logger.js');
      logError('SSR rendering failed', 'ssr', error);
      // Fall back to static HTML on error
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
