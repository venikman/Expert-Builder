import type { Hono } from "hono";
import { storage } from "./storage";
import { executeRequestSchema, submitRequestSchema } from "@shared/schema";
import { executeCode, getDiagnostics, runTests } from "./grading";

export function registerRoutes(app: Hono): void {
  app.get("/api/lessons", async (c) => {
    try {
      const lessons = await storage.getLessons();
      const safeLessons = lessons.map(({ referenceSolution, testCode, ...rest }) => rest);
      return c.json(safeLessons);
    } catch (error) {
      return c.json({ error: "Failed to fetch lessons" }, 500);
    }
  });

  app.get("/api/lessons/:id", async (c) => {
    try {
      const lesson = await storage.getLesson(c.req.param("id"));
      if (!lesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }
      const { referenceSolution, testCode, ...safeLesson } = lesson;
      return c.json(safeLesson);
    } catch (error) {
      return c.json({ error: "Failed to fetch lesson" }, 500);
    }
  });

  app.post("/api/execute", async (c) => {
    try {
      const body = await c.req.json();
      const parsed = executeRequestSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.errors }, 400);
      }

      const { code } = parsed.data;
      const result = await executeCode(code);
      return c.json(result);
    } catch (error) {
      return c.json({
        success: false,
        output: "",
        error: error instanceof Error ? error.message : "Execution failed"
      }, 500);
    }
  });

  app.post("/api/diagnostics", async (c) => {
    try {
      const body = await c.req.json();
      const parsed = executeRequestSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.errors }, 400);
      }

      const { code } = parsed.data;
      const diagnostics = await getDiagnostics(code);
      return c.json(diagnostics);
    } catch (error) {
      return c.json({
        diagnostics: [],
        error: error instanceof Error ? error.message : "Diagnostics failed"
      }, 500);
    }
  });

  app.post("/api/submit", async (c) => {
    try {
      const body = await c.req.json();
      const parsed = submitRequestSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.errors }, 400);
      }

      const { code, lessonId } = parsed.data;
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      const result = await runTests(code, lesson.id, lesson.title, lesson.testCode, lesson.hints);

      return c.json(result);
    } catch (error) {
      return c.json({
        success: false,
        totalTests: 0,
        passedTests: 0,
        results: [],
        hint: error instanceof Error ? error.message : "Grading failed"
      }, 500);
    }
  });
}
