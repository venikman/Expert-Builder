import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { executeRequestSchema, submitRequestSchema, insertLessonSchema } from "@shared/schema";
import { executeCode, getDiagnostics, runTests } from "./grading";

// Demo user ID for progress tracking (no auth implemented)
const DEMO_USER_ID = 1;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/lessons", async (req, res) => {
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

      const { code, lessonId } = parsed.data;
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

      const currentProgress = await storage.getLessonProgress(DEMO_USER_ID, lessonId);
      const currentScore = Math.round((result.passedTests / result.totalTests) * 100);
      const bestScore = Math.max(currentProgress?.bestScore || 0, currentScore);
      const attempts = (currentProgress?.attempts || 0) + 1;
      const isCompleted = result.success;
      
      await storage.updateLearnerProgress(DEMO_USER_ID, lessonId, {
        completed: isCompleted || currentProgress?.completed || false,
        bestScore,
        attempts,
        lastAttemptAt: new Date(),
        ...(isCompleted && !currentProgress?.completedAt ? { completedAt: new Date() } : {}),
      });
      
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

  // Instructor API routes - return full lesson data including solutions and tests
  app.get("/api/instructor/lessons", async (req, res) => {
    try {
      const lessons = await storage.getLessons();
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/instructor/lessons/:id", async (req, res) => {
    try {
      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.post("/api/instructor/lessons", async (req, res) => {
    try {
      const parsed = insertLessonSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      const lesson = await storage.createLesson(parsed.data);
      res.status(201).json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.patch("/api/instructor/lessons/:id", async (req, res) => {
    try {
      const parsed = insertLessonSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request", details: parsed.error.errors });
      }
      const lesson = await storage.updateLesson(req.params.id, parsed.data);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to update lesson" });
    }
  });

  app.delete("/api/instructor/lessons/:id", async (req, res) => {
    try {
      await storage.deleteLesson(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete lesson" });
    }
  });

  app.get("/api/progress", async (req, res) => {
    try {
      const progress = await storage.getLearnerProgress(DEMO_USER_ID);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  app.get("/api/progress/:lessonId", async (req, res) => {
    try {
      const progress = await storage.getLessonProgress(DEMO_USER_ID, req.params.lessonId);
      res.json(progress || { completed: false, bestScore: 0, attempts: 0 });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson progress" });
    }
  });

  // Get solution only if lesson is completed
  app.get("/api/lessons/:id/solution", async (req, res) => {
    try {
      const progress = await storage.getLessonProgress(DEMO_USER_ID, req.params.id);
      if (!progress?.completed) {
        return res.status(403).json({ error: "Complete the lesson first to view the solution" });
      }

      const lesson = await storage.getLesson(req.params.id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }

      res.json({ solution: lesson.referenceSolution });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch solution" });
    }
  });

  return httpServer;
}
