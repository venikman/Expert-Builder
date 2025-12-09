import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { executeRequestSchema, submitRequestSchema, insertLessonSchema, type SubmissionResult, type TestResult } from "@shared/schema";
import { spawn } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import { generatePersonalizedHint } from "./ai-tutor";

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

  app.get("/api/lessons/:id/animation", async (req, res) => {
    try {
      const animation = await storage.getLessonAnimation(req.params.id);
      if (!animation) {
        return res.status(404).json({ error: "Animation not found" });
      }
      res.json(animation);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch animation" });
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
      
      // Update learner progress (using demo user ID = 1)
      const DEMO_USER_ID = 1;
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

  // Progress tracking API routes
  // For now using userId=1 as demo user since no auth is implemented
  const DEMO_USER_ID = 1;

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

  return httpServer;
}

async function executeCode(code: string): Promise<{ success: boolean; output: string; error?: string; executionTime?: number }> {
  const startTime = Date.now();
  const workDir = join(tmpdir(), `csharp-${randomUUID()}`);
  
  try {
    await mkdir(workDir, { recursive: true });
    
    const programPath = join(workDir, "Program.cs");
    await writeFile(programPath, code);
    
    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;
    
    await writeFile(join(workDir, "Program.csproj"), csprojContent);
    
    console.log(`[dotnet] Executing code in ${workDir}`);
    const output = await runCommand("dotnet", ["run", "--project", workDir], 30000);
    const executionTime = Date.now() - startTime;
    console.log(`[dotnet] Success - stdout: ${output.stdout.substring(0, 200)}`);
    
    return {
      success: true,
      output: output.stdout,
      error: output.stderr || undefined,
      executionTime
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const fullError = [error.stdout, error.stderr, error.message].filter(Boolean).join('\n');
    console.log(`[dotnet] Error - code: ${error.code}, stderr: ${error.stderr?.substring(0, 500)}, stdout: ${error.stdout?.substring(0, 500)}`);
    return {
      success: false,
      output: error.stdout || "",
      error: fullError || "Execution failed",
      executionTime
    };
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {}
  }
}

async function runTests(
  code: string, 
  lessonId: string,
  lessonTitle: string,
  testCodeJson: string,
  hints: Record<string, string>
): Promise<SubmissionResult> {
  const tests = JSON.parse(testCodeJson) as Array<{
    name: string;
    input?: any;
    expected?: any;
    a?: number;
    b?: number;
    f?: string;
    g?: string;
  }>;
  
  const results: TestResult[] = [];
  let passedCount = 0;
  
  const workDir = join(tmpdir(), `csharp-test-${randomUUID()}`);
  
  try {
    await mkdir(workDir, { recursive: true });
    
    for (const test of tests) {
      const testResult = await runSingleTest(workDir, code, lessonId, test);
      results.push(testResult);
      if (testResult.passed) passedCount++;
    }
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {}
  }
  
  const failedTests = results.filter(r => !r.passed);
  let hint: string | undefined;
  
  if (failedTests.length > 0) {
    const firstFailedTest = failedTests[0];
    const staticHint = hints[firstFailedTest.name];
    
    // Generate personalized hint using AI tutor
    hint = await generatePersonalizedHint({
      lessonId,
      lessonTitle,
      code,
      failedTests: failedTests.map(t => ({ name: t.name, message: t.message })),
      staticHint
    });
  }
  
  return {
    success: passedCount === tests.length,
    totalTests: tests.length,
    passedTests: passedCount,
    results,
    hint
  };
}

async function runSingleTest(
  workDir: string,
  code: string,
  lessonId: string,
  test: { name: string; input?: any; expected?: any; a?: number; b?: number; f?: string; g?: string }
): Promise<TestResult> {
  const testDir = join(workDir, randomUUID());
  await mkdir(testDir, { recursive: true });
  
  try {
    let testProgram: string;
    
    switch (lessonId) {
      case "pure-functions":
        testProgram = generatePureFunctionTest(code, test.input, test.expected);
        break;
      case "map-filter":
        testProgram = generateMapFilterTest(code, test.input, test.expected);
        break;
      case "function-composition":
        testProgram = generateComposeTest(code, test.f!, test.g!, test.input, test.expected);
        break;
      case "option-type":
        testProgram = generateOptionTest(code, test.a!, test.b!, test.expected);
        break;
      case "reduce-fold":
        testProgram = generateReduceTest(code, test.input, test.expected);
        break;
      default:
        throw new Error(`Unknown lesson: ${lessonId}`);
    }
    
    await writeFile(join(testDir, "Program.cs"), testProgram);
    
    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;
    
    await writeFile(join(testDir, "Test.csproj"), csprojContent);
    
    const result = await runCommand("dotnet", ["run", "--project", testDir], 15000);
    
    if (result.stdout.trim() === "PASS") {
      return { name: test.name, passed: true };
    } else {
      return { 
        name: test.name, 
        passed: false, 
        message: result.stdout.trim() || result.stderr.trim() || "Test failed"
      };
    }
  } catch (error: any) {
    return { 
      name: test.name, 
      passed: false, 
      message: error.stderr || error.message || "Compilation or runtime error"
    };
  } finally {
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch {}
  }
}

function removeMainMethod(code: string): string {
  // Remove the Main method from the user's code to avoid duplicate Main methods
  // This regex matches "public static void Main()" and its body
  const mainMethodRegex = /\s*public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  return code.replace(mainMethodRegex, '');
}

function generatePureFunctionTest(code: string, input: number, expected: number): string {
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : "Exercise";
  const cleanCode = removeMainMethod(code);
  
  return `${cleanCode}

public class TestRunner
{
    public static void Main()
    {
        try
        {
            var result = ${className}.Square(${input});
            if (result == ${expected})
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected ${expected}, got {result}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
}

function generateMapFilterTest(code: string, input: number[], expected: number[]): string {
  const inputStr = input.length > 0 ? input.join(", ") : "";
  const expectedStr = JSON.stringify(expected);
  const cleanCode = removeMainMethod(code);
  
  return `${cleanCode}

public class TestRunner
{
    public static void Main()
    {
        try
        {
            var input = new List<int> { ${inputStr} };
            var result = Exercise.GetEvenSquares(input);
            var expected = new List<int> { ${expected.join(", ")} };
            
            if (result.Count == expected.Count && result.SequenceEqual(expected))
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected [${expected.join(", ")}], got [{string.Join(", ", result)}]");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
}

function generateComposeTest(code: string, fName: string, gName: string, input: number, expected: number): string {
  const fnDefs = `
Func<int, int> addOne = x => x + 1;
Func<int, int> @double = x => x * 2;
Func<int, int> triple = x => x * 3;
Func<int, int> square = x => x * x;
Func<int, int> negate = x => -x;
Func<int, int> identity = x => x;
`;
  
  const fVar = fName === "double" ? "@double" : fName;
  const gVar = gName === "double" ? "@double" : gName;
  const cleanCode = removeMainMethod(code);
  
  return `${cleanCode}

public class TestRunner
{
    public static void Main()
    {
        try
        {
            ${fnDefs}
            var composed = Exercise.Compose(${fVar}, ${gVar});
            var result = composed(${input});
            
            if (result == ${expected})
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected ${expected}, got {result}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
}

function generateOptionTest(code: string, a: number, b: number, expected: string): string {
  const isSome = expected.startsWith("Some");
  const expectedValue = isSome ? expected.match(/Some\((-?\d+)\)/)?.[1] : null;
  const cleanCode = removeMainMethod(code);
  
  return `${cleanCode}

public class TestRunner
{
    public static void Main()
    {
        try
        {
            var result = Exercise.SafeDivide(${a}, ${b});
            ${isSome 
              ? `if (result is Some<int>(var v) && v == ${expectedValue})
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected ${expected}, got {result}");`
              : `if (result is None<int>)
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected None, got {result}");`
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
}

function generateReduceTest(code: string, input: number[], expected: number): string {
  const inputStr = input.length > 0 ? input.join(", ") : "";
  const cleanCode = removeMainMethod(code);
  
  return `${cleanCode}

public class TestRunner
{
    public static void Main()
    {
        try
        {
            var input = new List<int> { ${inputStr} };
            var result = Exercise.Product(input);
            
            if (result == ${expected})
                Console.WriteLine("PASS");
            else
                Console.WriteLine($"Expected ${expected}, got {result}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`;
}

function runCommand(command: string, args: string[], timeout: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { timeout });
    
    let stdout = "";
    let stderr = "";
    
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject({ stdout, stderr, code });
      }
    });
    
    proc.on("error", (err) => {
      reject({ stdout, stderr, message: err.message });
    });
  });
}
