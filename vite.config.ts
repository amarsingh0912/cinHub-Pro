import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command, mode }) => {
  const isSSRBuild = mode === 'ssr';
  
  return {
    plugins: [
      react(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: isSSRBuild 
        ? path.resolve(import.meta.dirname, "dist/server")
        : path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      ssr: isSSRBuild ? path.resolve(import.meta.dirname, "client/src/entry-server.tsx") : undefined,
      manifest: !isSSRBuild, // Generate manifest for client build only
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
      hmr: false,
    },
    // SSR-specific options
    ssr: {
      noExternal: isSSRBuild ? ['wouter', 'react-router-dom'] : undefined,
    },
  };
});
