import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate, Counter } from "k6/metrics";

// Custom metrics
const executionTime = new Trend("execution_time_ms");
const serverExecutionTime = new Trend("server_execution_time_ms");
const successRate = new Rate("success_rate");
const errorCount = new Counter("errors");

// Configuration
const BASE_URL = __ENV.BASE_URL || "http://localhost:5050";

export const options = {
  scenarios: {
    // Warm-up scenario
    warmup: {
      executor: "shared-iterations",
      vus: 1,
      iterations: 1,
      startTime: "0s",
      exec: "warmup",
    },
    // Main performance test
    performance: {
      executor: "constant-vus",
      vus: 1,
      duration: "30s",
      startTime: "5s",
      exec: "executeTests",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000", "p(99)<2000"], // 95th < 1s, 99th < 2s
    success_rate: ["rate>0.95"], // 95% success rate
    execution_time_ms: ["p(95)<500"], // 95th percentile < 500ms
  },
};

const testCases = [
  {
    name: "simple_println",
    code: 'Console.WriteLine("Hello, World!");',
    expectedOutput: "Hello, World!",
  },
  {
    name: "math_calculation",
    code: `var result = Enumerable.Range(1, 100).Sum();
Console.WriteLine(result);`,
    expectedOutput: "5050",
  },
  {
    name: "class_with_main",
    code: `public class Program
{
    public static void Main()
    {
        Console.WriteLine("From Main!");
    }
}`,
    expectedOutput: "From Main!",
  },
  {
    name: "linq_operations",
    code: `var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
var evenSquares = numbers.Where(n => n % 2 == 0).Select(n => n * n).ToList();
Console.WriteLine(string.Join(", ", evenSquares));`,
    expectedOutput: "4, 16, 36, 64, 100",
  },
  {
    name: "generic_class",
    code: `public class Box<T>
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
}`,
    expectedOutput: "42",
  },
];

export function warmup() {
  console.log(`Warming up against ${BASE_URL}...`);

  const payload = JSON.stringify({
    code: 'Console.WriteLine("warmup");',
    lessonId: "k6-warmup",
  });

  const params = {
    headers: { "Content-Type": "application/json" },
    timeout: "30s",
  };

  const res = http.post(`${BASE_URL}/api/execute`, payload, params);

  const success = check(res, {
    "warmup status 200": (r) => r.status === 200,
    "warmup success": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch {
        return false;
      }
    },
  });

  console.log(`Warmup complete: ${res.timings.duration.toFixed(0)}ms (cold start)`);

  sleep(2); // Wait for runner to be fully warmed
  return success;
}

export function executeTests() {
  const testCase = testCases[Math.floor(Math.random() * testCases.length)];

  const payload = JSON.stringify({
    code: testCase.code,
    lessonId: "k6-perf-test",
  });

  const params = {
    headers: { "Content-Type": "application/json" },
    timeout: "30s",
    tags: { test_case: testCase.name },
  };

  const start = Date.now();
  const res = http.post(`${BASE_URL}/api/execute`, payload, params);
  const totalTime = Date.now() - start;

  executionTime.add(totalTime);

  let body;
  try {
    body = JSON.parse(res.body);
    if (body.executionTime) serverExecutionTime.add(body.executionTime);
  } catch {
    errorCount.add(1);
    successRate.add(false);
    return;
  }

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response is success": () => body.success === true,
    "output contains expected": () =>
      !testCase.expectedOutput || (body.output && body.output.includes(testCase.expectedOutput)),
  });

  successRate.add(success);
  if (!success) {
    errorCount.add(1);
    console.log(`FAIL [${testCase.name}]: ${body.error || "unexpected output"}`);
  }

  sleep(0.1);
}

export function handleSummary(data) {
  const p50 = data.metrics.http_req_duration?.values["p(50)"] || 0;
  const p95 = data.metrics.http_req_duration?.values["p(95)"] || 0;
  const p99 = data.metrics.http_req_duration?.values["p(99)"] || 0;
  const avg = data.metrics.http_req_duration?.values["avg"] || 0;
  const successPct = (data.metrics.success_rate?.values["rate"] || 0) * 100;

  const summary = `
═══════════════════════════════════════════════════════════════════════
  k6 Performance Test Results - ${BASE_URL}
═══════════════════════════════════════════════════════════════════════

  Requests:     ${data.metrics.http_reqs?.values["count"] || 0}
  Success Rate: ${successPct.toFixed(1)}%

  Response Times:
    avg:  ${avg.toFixed(0)}ms
    p50:  ${p50.toFixed(0)}ms
    p95:  ${p95.toFixed(0)}ms
    p99:  ${p99.toFixed(0)}ms

  Thresholds:
    p95 < 1000ms: ${p95 < 1000 ? "✅ PASS" : "❌ FAIL"} (${p95.toFixed(0)}ms)
    p99 < 2000ms: ${p99 < 2000 ? "✅ PASS" : "❌ FAIL"} (${p99.toFixed(0)}ms)
    Success > 95%: ${successPct >= 95 ? "✅ PASS" : "❌ FAIL"} (${successPct.toFixed(1)}%)

═══════════════════════════════════════════════════════════════════════
`;

  return {
    stdout: summary,
  };
}

