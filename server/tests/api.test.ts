import { describe, it, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import { createTestApp } from "./test-helpers";
import type { Express } from "express";

// Mock storage to avoid database dependency in tests
vi.mock("../storage", () => ({
  storage: {
    getLessons: vi.fn().mockResolvedValue([
      {
        id: "pure-functions",
        title: "Pure Functions",
        description: "Learn about pure functions",
        order: 1,
        content: "# Pure Functions\n\nA pure function...",
        starterCode: "public class Exercise {}",
        referenceSolution: "public class Exercise { public static int Square(int x) => x * x; }",
        testCode: "[]",
        hints: {},
      },
      {
        id: "map-filter",
        title: "Map and Filter",
        description: "Learn about map and filter",
        order: 2,
        content: "# Map and Filter\n\nMap transforms...",
        starterCode: "public class Exercise {}",
        referenceSolution: "public class Exercise {}",
        testCode: "[]",
        hints: {},
      },
    ]),
    getLesson: vi.fn().mockImplementation((id: string) => {
      if (id === "pure-functions") {
        return Promise.resolve({
          id: "pure-functions",
          title: "Pure Functions",
          description: "Learn about pure functions",
          order: 1,
          content: "# Pure Functions\n\nA pure function...",
          starterCode: "public class Exercise {}",
          referenceSolution: "public class Exercise { public static int Square(int x) => x * x; }",
          testCode: JSON.stringify([
            { name: "test_square_5", input: 5, expected: 25 },
          ]),
          hints: { test_square_5: "Try x * x" },
        });
      }
      return Promise.resolve(null);
    }),
    createSubmission: vi.fn().mockResolvedValue({}),
    getLessonProgress: vi.fn().mockResolvedValue(null),
    updateLearnerProgress: vi.fn().mockResolvedValue({}),
    getLearnerProgress: vi.fn().mockResolvedValue([]),
  },
}));

describe("API Endpoints", () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  describe("GET /api/lessons", () => {
    it("returns list of lessons without sensitive data", async () => {
      const response = await request(app).get("/api/lessons");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should not include sensitive data
      expect(response.body[0]).not.toHaveProperty("referenceSolution");
      expect(response.body[0]).not.toHaveProperty("testCode");

      // Should include public data
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("description");
    });
  });

  describe("GET /api/lessons/:id", () => {
    it("returns specific lesson without sensitive data", async () => {
      const response = await request(app).get("/api/lessons/pure-functions");

      expect(response.status).toBe(200);
      expect(response.body.id).toBe("pure-functions");
      expect(response.body.title).toBe("Pure Functions");

      // Should not include sensitive data
      expect(response.body).not.toHaveProperty("referenceSolution");
      expect(response.body).not.toHaveProperty("testCode");
    });

    it("returns 404 for non-existent lesson", async () => {
      const response = await request(app).get("/api/lessons/non-existent");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Lesson not found");
    });
  });

  describe("POST /api/execute", () => {
    it("executes valid C# code", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'Console.WriteLine("Hello");',
          lessonId: "pure-functions",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("output");
    }, 30000);

    it("returns 400 for invalid request", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request");
    });

    it("handles compilation errors", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: "invalid code{{{",
          lessonId: "pure-functions",
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    }, 30000);
  });

  describe("POST /api/diagnostics", () => {
    it("returns empty diagnostics for valid code", async () => {
      const response = await request(app)
        .post("/api/diagnostics")
        .send({
          code: 'Console.WriteLine("Hello");',
          lessonId: "pure-functions",
        });

      expect(response.status).toBe(200);
      expect(response.body.diagnostics).toBeDefined();
      expect(Array.isArray(response.body.diagnostics)).toBe(true);
    }, 30000);

    it("returns diagnostics for invalid code", async () => {
      const response = await request(app)
        .post("/api/diagnostics")
        .send({
          code: "int x = ",
          lessonId: "pure-functions",
        });

      expect(response.status).toBe(200);
      expect(response.body.diagnostics).toBeDefined();
      expect(response.body.diagnostics.length).toBeGreaterThan(0);
    }, 30000);

    it("returns 400 for invalid request", async () => {
      const response = await request(app)
        .post("/api/diagnostics")
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/submit", () => {
    it("returns 400 for invalid request", async () => {
      const response = await request(app)
        .post("/api/submit")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request");
    });

    it("returns 404 for non-existent lesson", async () => {
      const response = await request(app)
        .post("/api/submit")
        .send({
          code: "public class Exercise {}",
          lessonId: "non-existent",
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Lesson not found");
    });

    it("grades code submission correctly", async () => {
      const response = await request(app)
        .post("/api/submit")
        .send({
          code: `
public class Exercise
{
    public static int Square(int x) => x * x;
}
`,
          lessonId: "pure-functions",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("totalTests");
      expect(response.body).toHaveProperty("passedTests");
      expect(response.body).toHaveProperty("results");
    }, 60000);
  });

  describe("GET /api/progress", () => {
    it("returns learner progress", async () => {
      const response = await request(app).get("/api/progress");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("GET /api/progress/:lessonId", () => {
    it("returns progress for specific lesson", async () => {
      const response = await request(app).get("/api/progress/pure-functions");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("completed");
      expect(response.body).toHaveProperty("bestScore");
      expect(response.body).toHaveProperty("attempts");
    });
  });

  describe("Instructor API", () => {
    describe("GET /api/instructor/lessons", () => {
      it("returns full lesson data including solutions", async () => {
        const response = await request(app).get("/api/instructor/lessons");

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe("GET /api/instructor/lessons/:id", () => {
      it("returns full lesson with solution and tests", async () => {
        const response = await request(app).get("/api/instructor/lessons/pure-functions");

        expect(response.status).toBe(200);
        expect(response.body.id).toBe("pure-functions");
        // Instructor API should include all data
        expect(response.body).toHaveProperty("referenceSolution");
        expect(response.body).toHaveProperty("testCode");
      });

      it("returns 404 for non-existent lesson", async () => {
        const response = await request(app).get("/api/instructor/lessons/non-existent");

        expect(response.status).toBe(404);
      });
    });
  });
});
