import { spawn } from "child_process";
import { writeFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { tmpdir } from "os";
import type { SubmissionResult, TestResult, Diagnostic } from "@shared/schema";
import { INFRASTRUCTURE_ERROR_CODES } from "@shared/schema";

// Export for testing
export function removeMainMethod(code: string): string {
  // Remove the Main method from the user's code to avoid duplicate Main methods
  // This regex matches "public static void Main()" and its body
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

// Export for testing
export function runCommand(command: string, args: string[], timeout: number): Promise<{ stdout: string; stderr: string }> {
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


// Export for testing
export function parseDotnetOutput(output: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Match patterns like: Program.cs(5,12): error CS1002: ; expected
  const errorPattern = /(?:Program\.cs|[^(]+\.cs)\((\d+),(\d+)\):\s+(error|warning)\s+(\w+):\s+(.+)/gi;

  let match;
  while ((match = errorPattern.exec(output)) !== null) {
    const [, line, column, severity, code, message] = match;
    // Skip infrastructure errors
    if (INFRASTRUCTURE_ERROR_CODES.has(code)) continue;

    diagnostics.push({
      line: parseInt(line, 10),
      column: parseInt(column, 10),
      severity: severity.toLowerCase() as "error" | "warning",
      message: message.trim(),
      code,
    });
  }

  // Also catch general build errors without line numbers
  if (diagnostics.length === 0 && output.includes("error")) {
    const generalErrorPattern = /error\s+(\w+)?:\s*(.+)/gi;
    while ((match = generalErrorPattern.exec(output)) !== null) {
      const [, code, message] = match;
      // Skip infrastructure errors
      if (code && INFRASTRUCTURE_ERROR_CODES.has(code)) continue;
      if (message && !message.includes("Build FAILED") && !message.includes("Assets file")) {
        diagnostics.push({
          line: 1,
          column: 1,
          severity: "error",
          message: message.trim(),
          code: code || undefined,
        });
      }
    }
  }

  return diagnostics;
}


// Execute code without tests
export async function executeCode(code: string): Promise<{ success: boolean; output: string; error?: string; executionTime?: number }> {
  const startTime = Date.now();
  const workDir = join(tmpdir(), `csharp-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });

    const programPath = join(workDir, "Program.cs");
    await writeFile(programPath, code);

    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
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
    } catch {
      // Cleanup failure is non-critical
    }
  }
}

// Get diagnostics by compiling the code (without running)
export async function getDiagnostics(code: string): Promise<{ diagnostics: Diagnostic[] }> {
  const workDir = join(tmpdir(), `csharp-diag-${randomUUID()}`);

  try {
    await mkdir(workDir, { recursive: true });

    const programPath = join(workDir, "Program.cs");
    await writeFile(programPath, code);

    const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>`;

    await writeFile(join(workDir, "Program.csproj"), csprojContent);

    try {
      await runCommand("dotnet", ["build", workDir, "-v", "q"], 20000);
      return { diagnostics: [] };
    } catch (error: any) {
      const diagnostics = parseDotnetOutput(error.stdout + "\n" + error.stderr);
      return { diagnostics };
    }
  } finally {
    try {
      await rm(workDir, { recursive: true, force: true });
    } catch {
      // Cleanup failure is non-critical
    }
  }
}

// Run a single test
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
    <TargetFramework>net10.0</TargetFramework>
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
    } catch {
      // Cleanup failure is non-critical
    }
  }
}

// Run all tests for a submission
export async function runTests(
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
    } catch {
      // Cleanup failure is non-critical
    }
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
