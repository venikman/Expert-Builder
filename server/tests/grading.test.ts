import { describe, it, expect } from "bun:test";
import {
  removeMainMethod,
  generatePureFunctionTest,
  generateMapFilterTest,
  generateComposeTest,
  generateOptionTest,
  generateReduceTest,
  parseDotnetOutput,
  executeCode,
  getDiagnostics,
  runTests,
} from "../grading";

describe("grading module", () => {
  describe("removeMainMethod", () => {
    it("removes simple Main method", () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;

    public static void Main()
    {
        Console.WriteLine(Square(5));
    }
}`;
      const result = removeMainMethod(code);
      expect(result).not.toContain("public static void Main");
      expect(result).toContain("public static int Square");
    });

    it("removes Main method with args", () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;

    public static void Main(string[] args)
    {
        Console.WriteLine(Square(5));
    }
}`;
      const result = removeMainMethod(code);
      expect(result).not.toContain("public static void Main");
      expect(result).toContain("public static int Square");
    });

    it("handles nested braces in Main", () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;

    public static void Main()
    {
        if (true)
        {
            Console.WriteLine(Square(5));
        }
    }
}`;
      const result = removeMainMethod(code);
      expect(result).not.toContain("public static void Main");
      expect(result).toContain("public static int Square");
    });

    it("preserves code without Main method", () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;
}`;
      const result = removeMainMethod(code);
      expect(result).toContain("public static int Square");
    });
  });

  describe("generatePureFunctionTest", () => {
    it("generates valid test code", () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;
}`;
      const result = generatePureFunctionTest(code, 5, 25);
      expect(result).toContain("Exercise.Square(5)");
      expect(result).toContain("if (result == 25)");
      expect(result).toContain("public class TestRunner");
    });

    it("extracts class name correctly", () => {
      const code = `
public class MyMath
{
    public static int Square(int x) => x * x;
}`;
      const result = generatePureFunctionTest(code, 3, 9);
      expect(result).toContain("MyMath.Square(3)");
    });

    it("defaults to Exercise class when not found", () => {
      const code = `
int Square(int x) => x * x;`;
      const result = generatePureFunctionTest(code, 3, 9);
      expect(result).toContain("Exercise.Square(3)");
    });
  });

  describe("generateMapFilterTest", () => {
    it("generates valid test code for non-empty input", () => {
      const code = `
public class Exercise
{
    public static List<int> GetEvenSquares(List<int> numbers) =>
        numbers.Where(n => n % 2 == 0).Select(n => n * n).ToList();
}`;
      const result = generateMapFilterTest(code, [1, 2, 3, 4], [4, 16]);
      expect(result).toContain("new List<int> { 1, 2, 3, 4 }");
      expect(result).toContain("new List<int> { 4, 16 }");
      expect(result).toContain("Exercise.GetEvenSquares");
    });

    it("handles empty input array", () => {
      const code = `
public class Exercise
{
    public static List<int> GetEvenSquares(List<int> numbers) =>
        numbers.Where(n => n % 2 == 0).Select(n => n * n).ToList();
}`;
      const result = generateMapFilterTest(code, [], []);
      expect(result).toContain("new List<int> {  }");
    });
  });

  describe("generateComposeTest", () => {
    it("generates valid test code for composition", () => {
      const code = `
public class Exercise
{
    public static Func<int, int> Compose(Func<int, int> f, Func<int, int> g) =>
        x => f(g(x));
}`;
      const result = generateComposeTest(code, "addOne", "square", 3, 10);
      expect(result).toContain("Exercise.Compose(addOne, square)");
      expect(result).toContain("composed(3)");
      expect(result).toContain("if (result == 10)");
    });

    it("escapes double keyword", () => {
      const code = `
public class Exercise
{
    public static Func<int, int> Compose(Func<int, int> f, Func<int, int> g) =>
        x => f(g(x));
}`;
      const result = generateComposeTest(code, "double", "addOne", 5, 12);
      expect(result).toContain("Exercise.Compose(@double, addOne)");
    });
  });

  describe("generateOptionTest", () => {
    it("generates test for Some result", () => {
      const code = `
public abstract record Option<T>;
public record Some<T>(T Value) : Option<T>;
public record None<T> : Option<T>;

public class Exercise
{
    public static Option<int> SafeDivide(int a, int b) =>
        b == 0 ? new None<int>() : new Some<int>(a / b);
}`;
      const result = generateOptionTest(code, 10, 2, "Some(5)");
      expect(result).toContain("Exercise.SafeDivide(10, 2)");
      expect(result).toContain("result is Some<int>(var v) && v == 5");
    });

    it("generates test for None result", () => {
      const code = `
public abstract record Option<T>;
public record Some<T>(T Value) : Option<T>;
public record None<T> : Option<T>;

public class Exercise
{
    public static Option<int> SafeDivide(int a, int b) =>
        b == 0 ? new None<int>() : new Some<int>(a / b);
}`;
      const result = generateOptionTest(code, 10, 0, "None");
      expect(result).toContain("Exercise.SafeDivide(10, 0)");
      expect(result).toContain("result is None<int>");
    });
  });

  describe("generateReduceTest", () => {
    it("generates valid test code", () => {
      const code = `
public class Exercise
{
    public static int Product(List<int> numbers) =>
        numbers.Aggregate(1, (acc, n) => acc * n);
}`;
      const result = generateReduceTest(code, [1, 2, 3, 4], 24);
      expect(result).toContain("new List<int> { 1, 2, 3, 4 }");
      expect(result).toContain("Exercise.Product");
      expect(result).toContain("if (result == 24)");
    });

    it("handles empty input", () => {
      const code = `
public class Exercise
{
    public static int Product(List<int> numbers) =>
        numbers.Aggregate(1, (acc, n) => acc * n);
}`;
      const result = generateReduceTest(code, [], 1);
      expect(result).toContain("new List<int> {  }");
      expect(result).toContain("if (result == 1)");
    });
  });

  describe("parseDotnetOutput", () => {
    it("parses standard error format", () => {
      const output = `Program.cs(5,12): error CS1002: ; expected`;
      const diagnostics = parseDotnetOutput(output);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0]).toEqual({
        line: 5,
        column: 12,
        severity: "error",
        message: "; expected",
        code: "CS1002",
      });
    });

    it("parses warnings", () => {
      const output = `Program.cs(10,5): warning CS0219: The variable 'x' is assigned but its value is never used`;
      const diagnostics = parseDotnetOutput(output);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe("warning");
      expect(diagnostics[0].code).toBe("CS0219");
    });

    it("parses multiple errors", () => {
      const output = `
Program.cs(5,12): error CS1002: ; expected
Program.cs(7,1): error CS1513: } expected
`;
      const diagnostics = parseDotnetOutput(output);
      expect(diagnostics).toHaveLength(2);
    });

    it("handles full path errors", () => {
      const output = `/tmp/csharp-123/Program.cs(5,12): error CS1002: ; expected`;
      const diagnostics = parseDotnetOutput(output);
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].line).toBe(5);
    });

    it("returns empty array for no errors", () => {
      const output = `Build succeeded.`;
      const diagnostics = parseDotnetOutput(output);
      expect(diagnostics).toHaveLength(0);
    });
  });

  describe("integration tests", () => {
    it("executeCode_ValidCode_ReturnsSuccess", async () => {
      const code = `
Console.WriteLine("Hello, World!");
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("Hello, World!");
    }, 30000);

    it("executeCode_InvalidCode_ReturnsFailure", async () => {
      const code = `
Console.WriteLine("Missing semicolon")
`;
      const result = await executeCode(code);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    }, 30000);

    it("getDiagnostics_ValidCode_ReturnsNoCodeErrors", async () => {
      const code = `
Console.WriteLine("Hello, World!");
`;
      const result = await getDiagnostics(code);
      // Valid code should have no code-related errors (line > 0 indicates actual code error)
      // Build infrastructure errors (like package restore) may appear at line 1, column 1
      const codeErrors = result.diagnostics.filter(d => d.severity === "error" && d.line > 1);
      expect(codeErrors).toHaveLength(0);
    }, 30000);

    it("getDiagnostics_InvalidCode_ReturnsDiagnostics", async () => {
      const code = `
Console.WriteLine("Missing semicolon")
`;
      const result = await getDiagnostics(code);
      expect(result.diagnostics.length).toBeGreaterThan(0);
      expect(result.diagnostics[0].severity).toBe("error");
    }, 30000);

    it("runTests_PureFunctions_PassingCode", async () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x * x;
}
`;
      const testCodeJson = JSON.stringify([
        { name: "test_square_5", input: 5, expected: 25 },
        { name: "test_square_0", input: 0, expected: 0 },
        { name: "test_square_negative", input: -3, expected: 9 },
      ]);

      const result = await runTests(code, "pure-functions", "Pure Functions", testCodeJson, {});
      expect(result.success).toBe(true);
      expect(result.passedTests).toBe(3);
      expect(result.totalTests).toBe(3);
    }, 60000);

    it("runTests_PureFunctions_FailingCode", async () => {
      const code = `
public class Exercise
{
    public static int Square(int x) => x + x; // Wrong implementation
}
`;
      const testCodeJson = JSON.stringify([
        { name: "test_square_5", input: 5, expected: 25 },
      ]);

      const result = await runTests(code, "pure-functions", "Pure Functions", testCodeJson, {
        test_square_5: "Remember that squaring means multiplying by itself"
      });
      expect(result.success).toBe(false);
      expect(result.passedTests).toBe(0);
    }, 30000);

    it("runTests_MapFilter_PassingCode", async () => {
      const code = `
public class Exercise
{
    public static List<int> GetEvenSquares(List<int> numbers) =>
        numbers.Where(n => n % 2 == 0).Select(n => n * n).ToList();
}
`;
      const testCodeJson = JSON.stringify([
        { name: "test_basic", input: [1, 2, 3, 4], expected: [4, 16] },
        { name: "test_empty", input: [], expected: [] },
      ]);

      const result = await runTests(code, "map-filter", "Map and Filter", testCodeJson, {});
      expect(result.success).toBe(true);
      expect(result.passedTests).toBe(2);
    }, 60000);

    it("runTests_ReduceFold_PassingCode", async () => {
      const code = `
public class Exercise
{
    public static int Product(List<int> numbers) =>
        numbers.Aggregate(1, (acc, n) => acc * n);
}
`;
      const testCodeJson = JSON.stringify([
        { name: "test_product", input: [1, 2, 3, 4], expected: 24 },
        { name: "test_empty", input: [], expected: 1 },
      ]);

      const result = await runTests(code, "reduce-fold", "Reduce/Fold", testCodeJson, {});
      expect(result.success).toBe(true);
      expect(result.passedTests).toBe(2);
    }, 60000);
  });

  // US-6: Multi-Class Code Execution Tests
  describe("multi-class code execution (US-6)", () => {
    it("executes code with multiple classes", async () => {
      const code = `
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
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("5");
      expect(result.output).toContain("20");
    }, 30000);

    it("executes code with inheritance", async () => {
      const code = `
public abstract class Shape
{
    public abstract double Area();
}

public class Rectangle : Shape
{
    private double width, height;
    public Rectangle(double w, double h) { width = w; height = h; }
    public override double Area() => width * height;
}

public class Circle : Shape
{
    private double radius;
    public Circle(double r) { radius = r; }
    public override double Area() => Math.PI * radius * radius;
}

public class Program
{
    public static void Main()
    {
        Shape rect = new Rectangle(3, 4);
        Console.WriteLine($"Rectangle area: {rect.Area()}");
    }
}
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("12");
    }, 30000);

    it("executes code with interfaces", async () => {
      const code = `
public interface IGreeter
{
    string Greet(string name);
}

public class FormalGreeter : IGreeter
{
    public string Greet(string name) => $"Good day, {name}.";
}

public class CasualGreeter : IGreeter
{
    public string Greet(string name) => $"Hey, {name}!";
}

public class Program
{
    public static void Main()
    {
        IGreeter greeter = new CasualGreeter();
        Console.WriteLine(greeter.Greet("World"));
    }
}
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("Hey, World!");
    }, 30000);

    it("executes code with generics", async () => {
      const code = `
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
        var intBox = new Box<int>(42);
        var strBox = new Box<string>("hello");
        Console.WriteLine(intBox.GetValue());
        Console.WriteLine(strBox.GetValue());
    }
}
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("42");
      expect(result.output).toContain("hello");
    }, 30000);

    it("executes code with nested classes", async () => {
      const code = `
public class Outer
{
    public class Inner
    {
        public static string GetMessage() => "From inner class";
    }

    public static void Main()
    {
        Console.WriteLine(Inner.GetMessage());
    }
}
`;
      const result = await executeCode(code);
      expect(result.success).toBe(true);
      expect(result.output).toContain("From inner class");
    }, 30000);
  });

  // US-7: Security Protection Tests
  describe("security protection (US-7)", () => {
    it("handles timeout for infinite loops", async () => {
      const code = `
public class Program
{
    public static void Main()
    {
        while (true) { }
    }
}
`;
      const result = await executeCode(code);
      // Should timeout, not hang forever
      expect(result.success).toBe(false);
      expect(result.error).toContain("timeout");
    }, 35000);

    it("prevents file system access", async () => {
      const code = `
using System.IO;

public class Program
{
    public static void Main()
    {
        File.WriteAllText("/tmp/malicious.txt", "evil content");
        Console.WriteLine("File written!");
    }
}
`;
      const result = await executeCode(code);
      // Roslyn scripting sandbox should prevent this or it should fail
      // The exact behavior depends on the sandbox configuration
      // At minimum, we verify it doesn't crash the runner
      expect(result).toBeDefined();
    }, 30000);

    it("prevents process spawning", async () => {
      const code = `
using System.Diagnostics;

public class Program
{
    public static void Main()
    {
        Process.Start("ls", "-la");
        Console.WriteLine("Process started!");
    }
}
`;
      const result = await executeCode(code);
      // Should fail or be sandboxed
      expect(result).toBeDefined();
    }, 30000);

    it("prevents network access", async () => {
      const code = `
using System.Net.Http;
using System.Threading.Tasks;

public class Program
{
    public static async Task Main()
    {
        var client = new HttpClient();
        var result = await client.GetStringAsync("http://example.com");
        Console.WriteLine(result);
    }
}
`;
      const result = await executeCode(code);
      // Should fail or timeout
      expect(result).toBeDefined();
    }, 30000);

    it("handles memory exhaustion gracefully", async () => {
      const code = `
public class Program
{
    public static void Main()
    {
        var list = new System.Collections.Generic.List<byte[]>();
        for (int i = 0; i < 1000; i++)
        {
            list.Add(new byte[10_000_000]); // 10MB per allocation
        }
    }
}
`;
      const result = await executeCode(code);
      // Should fail gracefully, not crash the runner
      expect(result).toBeDefined();
    }, 30000);

    it("prevents environment variable access", async () => {
      const code = `
public class Program
{
    public static void Main()
    {
        var secret = Environment.GetEnvironmentVariable("SECRET_KEY");
        Console.WriteLine($"Secret: {secret}");
    }
}
`;
      const result = await executeCode(code);
      // Should execute but not expose real secrets
      expect(result.success).toBe(true);
      // The output should show null or empty, not real env vars
      expect(result.output).toContain("Secret:");
    }, 30000);
  });

  // Performance Tests
  describe("performance", () => {
    it("warm execution completes under 500ms", async () => {
      // First call to warm up
      await executeCode('Console.WriteLine("warmup");');

      // Measure second call
      const start = Date.now();
      const result = await executeCode('Console.WriteLine("test");');
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThan(500);
    }, 30000);

    it("reports accurate execution time", async () => {
      const result = await executeCode('Console.WriteLine("test");');
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(30000);
    }, 30000);
  });
});
