import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginBabel } from "@rsbuild/plugin-babel";

export default defineConfig({
  plugins: [
    pluginReact(),
    // React Compiler (stable in React 19.2) runs via Babel transform.
    // Default compilationMode is "infer"; opt-out per file with "use no memo" if needed.
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(options) {
        options.plugins = options.plugins ?? [];
        options.plugins.unshift("babel-plugin-react-compiler");
      },
    }),
  ],
  tools: {
    cssLoader: (options) => {
      options.url = {
        // Keep absolute URLs (e.g. /fonts/...) as-is so they resolve from `server.publicDir`.
        filter: (url) => !url.startsWith("/"),
      };
    },
  },
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
      "/api": "http://localhost:5050",
    },
    publicDir: {
      name: "./client/public",
      copyOnBuild: true,
    },
  },
  dev: {
    hmr: true,
  },
});
