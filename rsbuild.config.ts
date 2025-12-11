import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: "./client/src/main.tsx",
    },
  },
  resolve: {
    alias: {
      "@": "./client/src",
      "@shared": "./shared",
    },
  },
  html: {
    template: "./client/index.html",
  },
  output: {
    distPath: {
      root: "dist/public",
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  dev: {
    hmr: true,
  },
});
