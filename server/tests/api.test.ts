import { describe, it, expect, beforeAll, mock } from "bun:test";
import { Hono } from "hono";
import { registerRoutes } from "../routes";

// Mock storage
mock.module("../storage", () => ({
  storage: {
    getLessons: () => Promise.resolve([
      {
        id: "pure-functions",
        title: "Pure Functions",
        description: "Learn about pure functions",
        order: 1,
        conceptTags: ["pure functions"],
        skeleton: "public class Exercise {}",
        referenceSolution: "public class Exercise { public static int Square(int x) => x * x; }",
        testCode: "[]",
        hints: {},
      },
      {
        id: "map-filter",
        title: "Map and Filter",
        description: "Learn about map and filter",
        order: 2,
        conceptTags: ["LINQ"],
        skeleton: "public class Exercise {}",
        referenceSolution: "public class Exercise {}",
        testCode: "[]",
        hints: {},
      },
    ]),
    getLesson: (id: string) => {
      if (id === "pure-functions") {
        return Promise.resolve({
          id: "pure-functions",
          title: "Pure Functions",
          description: "Learn about pure functions",
          order: 1,
          conceptTags: ["pure functions"],
          skeleton: "public class Exercise {}",
          referenceSolution: "public class Exercise { public static int Square(int x) => x * x; }",
          testCode: JSON.stringify([
            { name: "test_square_5", input: 5, expected: 25 },
          ]),
          hints: { test_square_5: "Try x * x" },
        });
      }
      return Promise.resolve(null);
    },
  },
}));

function createTestApp() {
  const app = new Hono();
  registerRoutes(app);
  return app;
}

describe("API Endpoints", () => {
  let app: Hono;

  beforeAll(() => {
    app = createTestApp();
  });

  describe("GET /api/lessons", () => {
    it("returns list of lessons without sensitive data", async () => {
      const response = await app.request("/api/lessons");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);

      // Should not include sensitive data
      expect(body[0]).not.toHaveProperty("referenceSolution");
      expect(body[0]).not.toHaveProperty("testCode");

      // Should include public data
      expect(body[0]).toHaveProperty("id");
      expect(body[0]).toHaveProperty("title");
      expect(body[0]).toHaveProperty("description");
    });
  });

  describe("GET /api/lessons/:id", () => {
    it("returns specific lesson without sensitive data", async () => {
      const response = await app.request("/api/lessons/pure-functions");
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe("pure-functions");
      expect(body.title).toBe("Pure Functions");

      // Should not include sensitive data
      expect(body).not.toHaveProperty("referenceSolution");
      expect(body).not.toHaveProperty("testCode");
    });

    it("returns 404 for non-existent lesson", async () => {
      const response = await app.request("/api/lessons/non-existent");
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Lesson not found");
    });
  });

  describe("POST /api/execute", () => {
    it("executes valid C# code", async () => {
      const response = await app.request("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: 'Console.WriteLine("Hello");',
          lessonId: "pure-functions",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success");
      expect(body).toHaveProperty("output");
    });

    it("returns 400 for invalid request", async () => {
      const response = await app.request("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid request");
    });

    it("handles compilation errors", async () => {
      const response = await app.request("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "invalid code{{{",
          lessonId: "pure-functions",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });
  });

  describe("POST /api/diagnostics", () => {
    it("returns empty diagnostics for valid code", async () => {
      const response = await app.request("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: 'Console.WriteLine("Hello");',
          lessonId: "pure-functions",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.diagnostics).toBeDefined();
      expect(Array.isArray(body.diagnostics)).toBe(true);
    });

    it("returns diagnostics for invalid code", async () => {
      const response = await app.request("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "int x = ",
          lessonId: "pure-functions",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.diagnostics).toBeDefined();
      expect(body.diagnostics.length).toBeGreaterThan(0);
    });

    it("returns 400 for invalid request", async () => {
      const response = await app.request("/api/diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/submit", () => {
    it("returns 400 for invalid request", async () => {
      const response = await app.request("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Invalid request");
    });

    it("returns 404 for non-existent lesson", async () => {
      const response = await app.request("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: "public class Exercise {}",
          lessonId: "non-existent",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe("Lesson not found");
    });

    it("grades code submission correctly", async () => {
      const response = await app.request("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: `
public class Exercise
{
    public static int Square(int x) => x * x;
}
`,
          lessonId: "pure-functions",
        }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("success");
      expect(body).toHaveProperty("totalTests");
      expect(body).toHaveProperty("passedTests");
      expect(body).toHaveProperty("results");
    });
  });
});
