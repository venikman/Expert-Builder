import express from "express";
import { createServer } from "http";
import { registerRoutes } from "../routes";

export async function createTestApp() {
  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  await registerRoutes(httpServer, app);

  return app;
}
