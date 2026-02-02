import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    commonjsOptions: {
      include: ["tailwind.config.js", "node_modules/**"],
    },
  },
  optimizeDeps: {
    include: ["tailwind-config"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tailwind-config": fileURLToPath(new URL("./tailwind.config.js", import.meta.url)),
    }
  },
  server: {
    // Enable HTTPS for local development (required for Facebook SDK)
    https: process.env.HTTPS_ENABLED === 'true' ? {
      key: fs.existsSync(path.resolve(__dirname, 'localhost-key.pem')) 
        ? fs.readFileSync(path.resolve(__dirname, 'localhost-key.pem'))
        : undefined,
      cert: fs.existsSync(path.resolve(__dirname, 'localhost.pem'))
        ? fs.readFileSync(path.resolve(__dirname, 'localhost.pem'))
        : undefined,
    } : undefined,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Change this to your backend server's URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/chats': {
        target: 'http://localhost:3000', // Change this to your backend server's URL
        changeOrigin: true,
      },
    },
  },
});
