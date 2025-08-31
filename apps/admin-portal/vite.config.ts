import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    host: true,
    proxy: {
      "/api/teams": {
        target: "http://localhost:3002",
        changeOrigin: true,
        secure: false,
      },
      "/api/departments": {
        target: "http://localhost:3002",
        changeOrigin: true,
        secure: false,
      },
      "/api/riders": {
        target: "http://localhost:4005",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/riders/, "/api/v1"),
      },
      "/api/clients": {
        target: "http://localhost:3004",
        changeOrigin: true,
        secure: false,
      },
      "/api/stores": {
        target: "http://localhost:3004",
        changeOrigin: true,
        secure: false,
      },
      "/api/rider-earnings": {
        target: "http://localhost:3004",
        changeOrigin: true,
        secure: false,
      },
      "/api/vehicles": {
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/api/spare-parts": {
        target: "http://localhost:4006",
        changeOrigin: true,
        secure: false,
      },
      "/auth": {
        target: "http://localhost:4001",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://localhost:4001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
