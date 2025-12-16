import type { Hono } from "hono";
import { storage } from "./storage";
import { executeRequestSchema, submitRequestSchema } from "@shared/schema";
import { executeCode, getDiagnostics, runTests } from "./grading";
import { trackServerEvent } from "./analytics";

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

      const { code, lessonId } = parsed.data;
      const distinctId = c.req.header("x-ph-distinct-id") || "anonymous";
      const startedAt = Date.now();
      const result = await executeCode(code);
      trackServerEvent("roslyn_execute", distinctId, {
        lesson_id: lessonId,
        success: result.success,
        duration_ms: Date.now() - startedAt,
        runner_execution_time_ms: result.executionTime,
        output_length: result.output?.length ?? 0,
        has_error: Boolean(result.error),
      });
      return c.json(result);
    } catch (error) {
      trackServerEvent("roslyn_execute_error", c.req.header("x-ph-distinct-id") || "anonymous", {
        message: error instanceof Error ? error.message : "Execution failed",
      });
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

      const { code, lessonId } = parsed.data;
      const distinctId = c.req.header("x-ph-distinct-id") || "anonymous";
      const startedAt = Date.now();
      const diagnostics = await getDiagnostics(code);

      const errorCount = diagnostics.diagnostics.filter((d) => d.severity === "error").length;
      const warningCount = diagnostics.diagnostics.filter((d) => d.severity === "warning").length;

      trackServerEvent("roslyn_diagnostics", distinctId, {
        lesson_id: lessonId,
        duration_ms: Date.now() - startedAt,
        diagnostics_count: diagnostics.diagnostics.length,
        error_count: errorCount,
        warning_count: warningCount,
      });

      return c.json(diagnostics);
    } catch (error) {
      trackServerEvent("roslyn_diagnostics_error", c.req.header("x-ph-distinct-id") || "anonymous", {
        message: error instanceof Error ? error.message : "Diagnostics failed",
      });
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
      const distinctId = c.req.header("x-ph-distinct-id") || "anonymous";
      const startedAt = Date.now();
      const lesson = await storage.getLesson(lessonId);

      if (!lesson) {
        return c.json({ error: "Lesson not found" }, 404);
      }

      const result = await runTests(code, lesson.id, lesson.title, lesson.testCode, lesson.hints);
      trackServerEvent("roslyn_submit", distinctId, {
        lesson_id: lessonId,
        success: result.success,
        duration_ms: Date.now() - startedAt,
        passed_tests: result.passedTests,
        total_tests: result.totalTests,
      });

      return c.json(result);
    } catch (error) {
      trackServerEvent("roslyn_submit_error", c.req.header("x-ph-distinct-id") || "anonymous", {
        message: error instanceof Error ? error.message : "Grading failed",
      });
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
