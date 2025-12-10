import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { executeRequestSchema, submitRequestSchema } from "@shared/schema";
import { executeCode, getDiagnostics, runTests } from "./grading";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/lessons", async (_req, res) => {
    try {
      const lessons = await storage.getLessons();
      const safeLessons = lessons.map(({ referenceSolution, testCode, ...rest }) => rest);
      res.json(safeLessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      const { referenceSolution, testCode, ...safeLesson } = lesson;
      res.json(safeLesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/execute", async (req, res) => {
    try {
      const parsed = executeRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { code } = parsed.data;
      const result = await executeCode(code);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Execution failed"
      });
    }
  });

  // Diagnostics endpoint for LSP-like functionality
  app.post("/api/diagnostics", async (req, res) => {
    try {
      const parsed = executeRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { code } = parsed.data;
      const diagnostics = await getDiagnostics(code);
      res.json(diagnostics);
    } catch (error) {
      res.status(500).json({
        diagnostics: [],
        error: error instanceof Error ? error.message : "Diagnostics failed"
      });
    }
  });

  app.post("/api/submit", async (req, res) => {
    try {
      const parsed = submitRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }

      const { code, lessonId } = parsed.data;
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      const result = await runTests(code, lesson.id, lesson.title, lesson.testCode, lesson.hints as Record<string, string>);

      await storage.createSubmission(lessonId, code, result);

      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        totalTests: 0,
        passedTests: 0,
        results: [],
        hint: error instanceof Error ? error.message : "Grading failed"
      });
    }
  });

  return httpServer;
}
