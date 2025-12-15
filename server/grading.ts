import { spawn, ChildProcess } from "child_process";
import { createInterface, Interface } from "readline";
import type { SubmissionResult, TestResult, Diagnostic } from "@shared/schema";

// Roslyn Runner singleton
let runnerProcess: ChildProcess | null = null;
let runnerReadline: Interface | null = null;
let runnerReady = false;
let pendingRequests: Map<number, { resolve: (v: any) => void; reject: (e: any) => void }> = new Map();
let requestId = 0;

interface RunnerResponse {
  Success: boolean;
  Output?: string;
  Error?: string;
  Diagnostics?: string[];
  ExecutionTimeMs: number;
}

// Start the Roslyn runner process
export async function startRunner(): Promise<void> {
  if (runnerProcess && runnerReady) {
    return;
  }

  return new Promise((resolve, reject) => {
    const runnerPath = process.env.ROSLYN_RUNNER_PATH;
    let startupTimeoutId: ReturnType<typeof setTimeout> | null = null;

    // In production, use the pre-built executable
    // In development, use dotnet run
    if (runnerPath) {
      console.log(`[Runner] Starting Roslyn runner from: ${runnerPath}`);
      runnerProcess = spawn(runnerPath, [], {
        stdio: ["pipe", "pipe", "pipe"]
      });
    } else {
      console.log(`[Runner] Starting Roslyn runner via dotnet run (dev mode)`);
      runnerProcess = spawn("dotnet", ["run", "--project", "./roslyn-runner/RoslynRunner.csproj", "--configuration", "Release"], {
        stdio: ["pipe", "pipe", "pipe"]
      });
    }

    runnerReadline = createInterface({
      input: runnerProcess.stdout!,
      crlfDelay: Infinity
    });

    runnerProcess.stderr?.on("data", (data) => {
      console.log(`[Runner] ${data.toString().trim()}`);
    });

    runnerReadline.on("line", (line) => {
      if (line === "READY") {
        console.log("[Runner] Roslyn runner is ready");
        runnerReady = true;
        if (startupTimeoutId) {
          clearTimeout(startupTimeoutId);
          startupTimeoutId = null;
        }
        resolve();
        return;
      }

      // Parse JSON response
      // Note: Runner processes requests serially, so FIFO ordering is safe
      // as long as we don't have concurrent requests (which we don't in single-user mode)
      try {
        const response = JSON.parse(line) as RunnerResponse;
        // Get the oldest pending request (FIFO)
        const [id, handlers] = pendingRequests.entries().next().value || [];
        if (id !== undefined && handlers) {
          pendingRequests.delete(id);
          handlers.resolve(response);
        }
      } catch (e) {
        console.error(`[Runner] Failed to parse response: ${line}`);
      }
    });

    runnerProcess.on("error", (err) => {
      console.error(`[Runner] Process error: ${err.message}`);
      runnerReady = false;
      if (startupTimeoutId) {
        clearTimeout(startupTimeoutId);
        startupTimeoutId = null;
      }
      reject(err);
    });

    runnerProcess.on("exit", (code) => {
      console.log(`[Runner] Process exited with code ${code}`);
      runnerReady = false;
      runnerProcess = null;
      runnerReadline = null;

      // Reject all pending requests
      for (const [, handlers] of pendingRequests) {
        handlers.reject(new Error("Runner process exited"));
      }
      pendingRequests.clear();
    });

    // Timeout for startup
    startupTimeoutId = setTimeout(() => {
      if (!runnerReady) {
        reject(new Error("Runner startup timeout"));
      }
    }, 30000);
  });
}

// Send code to the runner and get result
async function runWithRunner(code: string, timeoutMs: number = 30000, compileOnly: boolean = false): Promise<RunnerResponse> {
  if (!runnerProcess || !runnerReady) {
    await startRunner();
  }

  return new Promise((resolve, reject) => {
    const id = ++requestId;

    const request = JSON.stringify({ Code: code, TimeoutMs: timeoutMs, CompileOnly: compileOnly });

    pendingRequests.set(id, { resolve, reject });

    runnerProcess!.stdin!.write(request + "\n");

    // Timeout for this specific request
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Execution timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs + 5000);
  });
}

// Export for testing
export function removeMainMethod(code: string): string {
  const mainMethodRegex = /\s*public\s+static\s+void\s+Main\s*\([^)]*\)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  return code.replace(mainMethodRegex, '');
}

// Export for testing
export function generatePureFunctionTest(code: string, input: number, expected: number): string {
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

// Export for testing
export function generateMapFilterTest(code: string, input: number[], expected: number[]): string {
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

// Export for testing
export function generateComposeTest(code: string, fName: string, gName: string, input: number, expected: number): string {
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

// Export for testing
export function generateOptionTest(code: string, a: number, b: number, expected: string): string {
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

// Export for testing
export function generateReduceTest(code: string, input: number[], expected: number): string {
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

// Export for testing - parse Roslyn diagnostics
export function parseDotnetOutput(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Match patterns like: (5,12): error CS1002: ; expected
  const errorPattern = /\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)/gi;

  let match;
  while ((match = errorPattern.exec(output)) !== null) {
    const [, line, column, severity, code, message] = match;
    diagnostics.push({
      line: parseInt(line, 10),
      column: parseInt(column, 10),
      severity: severity.toLowerCase() as "error" | "warning",
      message: message.trim(),
      code,
    });
  }

  return diagnostics;
}

// Check if code has a Main method
function hasMainMethod(code: string): boolean {
  const mainPattern = /\bstatic\s+(void|async\s+Task)\s+Main\s*\(/;
  return mainPattern.test(code);
}

// Wrap code with a default Main method if missing
function ensureMainMethod(code: string): string {
  if (hasMainMethod(code)) {
    return code;
  }

  return `${code}

public class Program
{
    public static void Main()
    {
        Console.WriteLine("Code compiled successfully. Add a Main() method to see output.");
    }
}`;
}

// Execute code without tests
export async function executeCode(code: string): Promise<{ success: boolean; output: string; error?: string; executionTime?: number }> {
  try {
    const codeWithMain = ensureMainMethod(code);
    const response = await runWithRunner(codeWithMain, 30000);

    return {
      success: response.Success,
      output: response.Output || "",
      error: response.Error,
      executionTime: response.ExecutionTimeMs
    };
  } catch (error: any) {
    return {
      success: false,
      output: "",
      error: error.message || "Execution failed"
    };
  }
}

// Get diagnostics by compiling the code (without running)
export async function getDiagnostics(code: string): Promise<{ diagnostics: Diagnostic[] }> {
  try {
    // Use compile-only mode - no code execution, just compilation checking
    const response = await runWithRunner(code, 20000, true);

    if (response.Success) {
      return { diagnostics: [] };
    }

    // The Error property contains all diagnostics, newline-separated
    return { diagnostics: parseDotnetOutput(response.Error || "") };
  } catch (error: any) {
    return {
      diagnostics: [{
        line: 1,
        column: 1,
        severity: "error",
        message: error.message || "Failed to get diagnostics"
      }]
    };
  }
}

// Run a single test using the runner
async function runSingleTest(
  code: string,
  lessonId: string,
  test: { name: string; input?: any; expected?: any; a?: number; b?: number; f?: string; g?: string }
): Promise<TestResult> {
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

    const response = await runWithRunner(testProgram, 15000);

    if (response.Success && response.Output?.trim() === "PASS") {
      return { name: test.name, passed: true };
    } else {
      return {
        name: test.name,
        passed: false,
        message: response.Output?.trim() || response.Error || "Test failed"
      };
    }
  } catch (error: any) {
    return {
      name: test.name,
      passed: false,
      message: error.message || "Compilation or runtime error"
    };
  }
}

// Run all tests for a submission
export async function runTests(
  code: string,
  lessonId: string,
  _lessonTitle: string,
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

  for (const test of tests) {
    const testResult = await runSingleTest(code, lessonId, test);
    results.push(testResult);
    if (testResult.passed) passedCount++;
  }

  const failedTests = results.filter(r => !r.passed);
  let hint: string | undefined;

  if (failedTests.length > 0) {
    const firstFailedTest = failedTests[0];
    hint = hints[firstFailedTest.name] || "Check your solution and try again.";
  }

  return {
    success: passedCount === tests.length,
    totalTests: tests.length,
    passedTests: passedCount,
    results,
    hint
  };
}
