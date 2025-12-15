#!/usr/bin/env bun
/**
 * Performance test script for code execution times
 *
 * Usage:
 *   bun tools/perf/perf-test.ts                   # Test local API server
 *   bun tools/perf/perf-test.ts --prod            # Test production
 *   bun tools/perf/perf-test.ts --iterations 20   # Run 20 iterations
 */

const DEFAULT_LOCAL_URL = "http://localhost:5050";
const PROD_URL = "https://expert-builder.fly.dev";

interface ExecuteResponse {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

interface TestCase {
  name: string;
  code: string;
  expectedOutput?: string;
}

const testCases: TestCase[] = [
  {
    name: "Simple println",
    code: `Console.WriteLine("Hello, World!");`,
    expectedOutput: "Hello, World!",
  },
  {
    name: "Math calculation",
    code: `
var result = Enumerable.Range(1, 100).Sum();
Console.WriteLine(result);
`,
    expectedOutput: "5050",
  },
  {
    name: "Class with Main",
    code: `
public class Program
{
    public static void Main()
    {
        Console.WriteLine("From Main!");
    }
}
`,
    expectedOutput: "From Main!",
  },
  {
    name: "Multiple classes",
    code: `
public class Calculator
{
    public static int Add(int a, int b) => a + b;
    public static int Multiply(int a, int b) => a * b;
}

public class Program
{
    public static void Main()
    {
        Console.WriteLine(Calculator.Add(2, 3));
        Console.WriteLine(Calculator.Multiply(4, 5));
    }
}
`,
    expectedOutput: "5",
  },
  {
    name: "LINQ operations",
    code: `
var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
var evenSquares = numbers.Where(n => n % 2 == 0).Select(n => n * n).ToList();
Console.WriteLine(string.Join(", ", evenSquares));
`,
    expectedOutput: "4, 16, 36, 64, 100",
  },
  {
    name: "Generic class",
    code: `
public class Box<T>
{
    private T value;
    public Box(T v) { value = v; }
    public T GetValue() => value;
}

public class Program
{
    public static void Main()
    {
        var box = new Box<int>(42);
        Console.WriteLine(box.GetValue());
    }
}
`,
    expectedOutput: "42",
  },
];

async function executeCode(
  baseUrl: string,
  code: string
): Promise<{ response: ExecuteResponse; totalTime: number }> {
  const start = performance.now();

  const res = await fetch(`${baseUrl}/api/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, lessonId: "perf-test" }),
  });

  const totalTime = performance.now() - start;
  const response = (await res.json()) as ExecuteResponse;

  return { response, totalTime };
}

async function warmUp(baseUrl: string): Promise<number> {
  console.log("\n🔥 Warming up runner...");
  const { totalTime } = await executeCode(baseUrl, `Console.WriteLine("warmup");`);
  console.log(`   Cold start: ${totalTime.toFixed(0)}ms\n`);
  return totalTime;
}

async function runTestCase(
  baseUrl: string,
  testCase: TestCase,
  iterations: number
): Promise<{ times: number[]; serverTimes: number[]; successes: number }> {
  const times: number[] = [];
  const serverTimes: number[] = [];
  let successes = 0;

  for (let i = 0; i < iterations; i++) {
    const { response, totalTime } = await executeCode(baseUrl, testCase.code);
    times.push(totalTime);
    if (response.executionTime) serverTimes.push(response.executionTime);

    if (
      response.success &&
      (!testCase.expectedOutput || response.output.includes(testCase.expectedOutput))
    ) {
      successes++;
    }
  }

  return { times, serverTimes, successes };
}

function calculateStats(times: number[]): {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
} {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = times.reduce((a, b) => a + b, 0);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: sum / times.length,
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function formatStats(stats: {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}): string {
  return `min=${stats.min.toFixed(0)}ms avg=${stats.avg.toFixed(0)}ms p50=${stats.p50.toFixed(0)}ms p95=${stats.p95.toFixed(0)}ms max=${stats.max.toFixed(0)}ms`;
}

async function main() {
  const args = process.argv.slice(2);
  const isProd = args.includes("--prod");
  const iterationsArg = args.indexOf("--iterations");
  const iterations = iterationsArg !== -1 ? parseInt(args[iterationsArg + 1]) || 10 : 10;

  const baseUrl = isProd ? PROD_URL : DEFAULT_LOCAL_URL;

  console.log("═".repeat(70));
  console.log(`  Performance Test - ${isProd ? "PRODUCTION" : "LOCAL"}`);
  console.log(`  URL: ${baseUrl}`);
  console.log(`  Iterations per test: ${iterations}`);
  console.log("═".repeat(70));

  const coldStartTime = await warmUp(baseUrl);

  const results: Array<{
    name: string;
    stats: ReturnType<typeof calculateStats>;
    serverStats?: ReturnType<typeof calculateStats>;
    successRate: number;
  }> = [];

  for (const testCase of testCases) {
    process.stdout.write(`Testing: ${testCase.name.padEnd(20)}`);

    const { times, serverTimes, successes } = await runTestCase(baseUrl, testCase, iterations);
    const stats = calculateStats(times);
    const serverStats = serverTimes.length > 0 ? calculateStats(serverTimes) : undefined;
    const successRate = (successes / iterations) * 100;

    results.push({ name: testCase.name, stats, serverStats, successRate });

    console.log(` ✓ ${formatStats(stats)} (${successRate.toFixed(0)}% pass)`);
  }

  console.log("\n" + "═".repeat(70));
  console.log("  SUMMARY");
  console.log("═".repeat(70));

  const allTimes = results.map((r) => r.stats.avg);
  const overallAvg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;

  console.log(`\n  Cold start:     ${coldStartTime.toFixed(0)}ms`);
  console.log(`  Warm avg:       ${overallAvg.toFixed(0)}ms (total round-trip)`);

  if (results[0].serverStats) {
    const serverAvg =
      results.map((r) => r.serverStats?.avg || 0).reduce((a, b) => a + b, 0) / results.length;
    console.log(`  Server exec:    ${serverAvg.toFixed(0)}ms (execution only)`);
    console.log(`  Network:        ~${(overallAvg - serverAvg).toFixed(0)}ms`);
  }

  console.log(`\n  All tests pass: ${results.every((r) => r.successRate === 100) ? "✅ YES" : "❌ NO"}`);

  console.log("\n  Performance Targets:");
  console.log(
    `    Cold start < 3000ms: ${coldStartTime < 3000 ? "✅" : "❌"} (${coldStartTime.toFixed(0)}ms)`
  );
  console.log(
    `    Warm exec < 500ms:   ${overallAvg < 500 ? "✅" : "❌"} (${overallAvg.toFixed(0)}ms)`
  );
  console.log(
    `    Warm exec < 200ms:   ${overallAvg < 200 ? "✅" : "❌"} (${overallAvg.toFixed(0)}ms)`
  );

  console.log("\n" + "═".repeat(70));
}

main().catch(console.error);

