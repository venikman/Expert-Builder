import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { registerRoutes } from "./routes";

const app = new Hono();

// Custom logger
app.use("*", logger((message) => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [hono] ${message}`);
}));

export function log(message: string, source = "hono") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Register API routes
registerRoutes(app);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = import.meta.dirname + "/public";

  app.use("/*", serveStatic({ root: distPath }));

  // SPA fallback
  app.get("*", serveStatic({ path: distPath + "/index.html" }));
}

const port = parseInt(process.env.PORT || "5050", 10);
const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

log(`serving on ${host}:${port}`);

export default {
  port,
  hostname: host,
  fetch: app.fetch,
};
