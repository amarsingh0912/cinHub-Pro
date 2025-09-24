import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeAdminUser } from "./auth";

const app = express();

// Trust proxy for secure cookies and accurate client IP behind reverse proxy
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") && !path.startsWith("/api/auth")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Redact sensitive data from logs
        const safeResponse = { ...capturedJsonResponse };
        if (safeResponse.accessToken) safeResponse.accessToken = "[REDACTED]";
        if (safeResponse.refreshToken) safeResponse.refreshToken = "[REDACTED]";
        if (safeResponse.password) safeResponse.password = "[REDACTED]";
        logLine += ` :: ${JSON.stringify(safeResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Initialize default admin user
  await initializeAdminUser();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error safely without exposing sensitive data
    console.error(`Error ${status}:`, {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      url: _req.url,
      method: _req.method
    });

    // Send error response and end - don't throw to avoid crashing process
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      log('HTTP server closed.');
      
      // Close WebSocket connections
      const { websocketService } = require('./services/websocketService');
      websocketService.shutdown();
      
      // Close database connections if any
      // Add any other cleanup here
      
      log('Graceful shutdown completed.');
      process.exit(0);
    });
    
    // Force close server after 10 seconds
    setTimeout(() => {
      log('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`);
    console.error(error);
    gracefulShutdown('uncaughtException');
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    log(`Unhandled rejection at: ${promise}, reason: ${reason}`);
    gracefulShutdown('unhandledRejection');
  });
})();
