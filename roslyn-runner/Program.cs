using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;

// Warm up Roslyn on startup
Console.Error.WriteLine("[RoslynRunner] Starting up...");
var warmupOptions = ScriptOptions.Default
    .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
    .WithReferences(
        typeof(object).Assembly,
        typeof(Console).Assembly,
        typeof(Enumerable).Assembly,
        typeof(List<>).Assembly
    );

// Warm-up compilation
try
{
    await CSharpScript.EvaluateAsync("1 + 1", warmupOptions);
    Console.Error.WriteLine("[RoslynRunner] Warm-up complete, ready for requests");
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[RoslynRunner] Warm-up failed: {ex.Message}");
}

// Signal ready
Console.WriteLine("READY");
Console.Out.Flush();

// JSON options with more permissive settings
var jsonOptions = new JsonSerializerOptions
{
    PropertyNameCaseInsensitive = true,
    AllowTrailingCommas = true
};

// Process requests
while (true)
{
    var line = Console.ReadLine();
    if (line == null) break;

    try
    {
        var request = JsonSerializer.Deserialize<ExecuteRequest>(line, jsonOptions);
        if (request == null)
        {
            SendResponse(new ExecuteResponse { Success = false, Error = "Invalid request" });
            continue;
        }

        ExecuteResponse result;
        if (request.CompileOnly)
        {
            result = CompileCode(request.Code, request.TimeoutMs);
        }
        else
        {
            result = await ExecuteCode(request.Code, request.TimeoutMs);
        }
        SendResponse(result);
    }
    catch (Exception ex)
    {
        SendResponse(new ExecuteResponse { Success = false, Error = ex.Message });
    }
}

static void SendResponse(ExecuteResponse response)
{
    var json = JsonSerializer.Serialize(response);
    Console.WriteLine(json);
    Console.Out.Flush();
}

// Compile-only: returns diagnostics without executing code
static ExecuteResponse CompileCode(string code, int timeoutMs)
{
    var sw = System.Diagnostics.Stopwatch.StartNew();

    // Security check first
    var (isValid, securityError) = SecurityValidator.Validate(code);
    if (!isValid)
    {
        return new ExecuteResponse
        {
            Success = false,
            Error = securityError,
            Diagnostics = [securityError!],
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }

    try
    {
        var options = ScriptOptions.Default
            .WithImports("System", "System.Collections.Generic", "System.Linq", "System.Text")
            .WithReferences(
                typeof(object).Assembly,
                typeof(Console).Assembly,
                typeof(Enumerable).Assembly,
                typeof(List<>).Assembly
            );

        using var cts = new CancellationTokenSource(timeoutMs);
        var script = CSharpScript.Create(code, options);
        var compilation = script.Compile(cts.Token);

        if (compilation.Any(d => d.Severity == Microsoft.CodeAnalysis.DiagnosticSeverity.Error))
        {
            var diagnostics = compilation
                .Where(d => d.Severity == Microsoft.CodeAnalysis.DiagnosticSeverity.Error)
                .Select(d => FormatDiagnostic(d, code))
                .ToList();

            return new ExecuteResponse
            {
                Success = false,
                Error = string.Join("\n", diagnostics),
                Diagnostics = diagnostics,
                ExecutionTimeMs = (int)sw.ElapsedMilliseconds
            };
        }

        return new ExecuteResponse
        {
            Success = true,
            Output = "",
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
    catch (CompilationErrorException ex)
    {
        return new ExecuteResponse
        {
            Success = false,
            Error = string.Join("\n", ex.Diagnostics.Select(d => FormatDiagnostic(d, code))),
            Diagnostics = ex.Diagnostics.Select(d => FormatDiagnostic(d, code)).ToList(),
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
    catch (Exception ex)
    {
        return new ExecuteResponse
        {
            Success = false,
            Error = ex.Message,
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
}

static async Task<ExecuteResponse> ExecuteCode(string code, int timeoutMs)
{
    var sw = System.Diagnostics.Stopwatch.StartNew();
    var output = new StringBuilder();
    var errors = new StringBuilder();

    // Security check first
    var (isValid, securityError) = SecurityValidator.Validate(code);
    if (!isValid)
    {
        return new ExecuteResponse
        {
            Success = false,
            Error = securityError,
            Diagnostics = [securityError!],
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }

    try
    {
        // Capture Console.WriteLine output
        var originalOut = Console.Out;
        var originalError = Console.Error;

        using var outputWriter = new StringWriter(output);
        using var errorWriter = new StringWriter(errors);

        Console.SetOut(outputWriter);
        Console.SetError(errorWriter);

        try
        {
            var options = ScriptOptions.Default
                .WithImports(
                    "System",
                    "System.Collections.Generic",
                    "System.Linq",
                    "System.Text"
                )
                .WithReferences(
                    typeof(object).Assembly,
                    typeof(Console).Assembly,
                    typeof(Enumerable).Assembly,
                    typeof(List<>).Assembly
                );

            var wrappedCode = WrapCode(code);

            using var cts = new CancellationTokenSource(timeoutMs);

            var script = CSharpScript.Create(wrappedCode, options);
            var compilation = script.Compile(cts.Token);

            if (compilation.Any(d => d.Severity == Microsoft.CodeAnalysis.DiagnosticSeverity.Error))
            {
                var diagnostics = compilation
                    .Where(d => d.Severity == Microsoft.CodeAnalysis.DiagnosticSeverity.Error)
                    .Select(d => FormatDiagnostic(d, code))
                    .ToList();

                return new ExecuteResponse
                {
                    Success = false,
                    Error = string.Join("\n", diagnostics),
                    Diagnostics = diagnostics,
                    ExecutionTimeMs = (int)sw.ElapsedMilliseconds
                };
            }

            await script.RunAsync(cancellationToken: cts.Token);
        }
        finally
        {
            Console.SetOut(originalOut);
            Console.SetError(originalError);
        }

        sw.Stop();
        return new ExecuteResponse
        {
            Success = true,
            Output = output.ToString(),
            Error = errors.Length > 0 ? errors.ToString() : null,
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
    catch (CompilationErrorException ex)
    {
        return new ExecuteResponse
        {
            Success = false,
            Error = string.Join("\n", ex.Diagnostics.Select(d => FormatDiagnostic(d, code))),
            Diagnostics = ex.Diagnostics.Select(d => FormatDiagnostic(d, code)).ToList(),
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
    catch (OperationCanceledException)
    {
        return new ExecuteResponse
        {
            Success = false,
            Output = output.ToString(),
            Error = $"Execution timed out after {timeoutMs}ms",
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
    catch (Exception ex)
    {
        return new ExecuteResponse
        {
            Success = false,
            Output = output.ToString(),
            Error = ex.InnerException?.Message ?? ex.Message,
            ExecutionTimeMs = (int)sw.ElapsedMilliseconds
        };
    }
}

static string WrapCode(string code)
{
    // Check if code contains a class with Main method
    if (code.Contains("static void Main") || code.Contains("static async Task Main"))
    {
        // Find the class that contains Main - look for TestRunner first (for tests),
        // otherwise use the class right before "static void Main"
        string? className = null;
        bool hasArgs = false;

        // Check for TestRunner class (used in test harnesses)
        if (code.Contains("class TestRunner"))
        {
            className = "TestRunner";
        }
        else
        {
            // Find the last class declaration before "static void Main"
            var mainIndex = code.IndexOf("static void Main");
            if (mainIndex == -1) mainIndex = code.IndexOf("static async Task Main");

            if (mainIndex > 0)
            {
                var codeBeforeMain = code.Substring(0, mainIndex);
                var classMatches = System.Text.RegularExpressions.Regex.Matches(
                    codeBeforeMain,
                    @"(?:public\s+)?class\s+(\w+)"
                );

                if (classMatches.Count > 0)
                {
                    className = classMatches[classMatches.Count - 1].Groups[1].Value;
                }
            }
        }

        // Check if Main takes string[] args parameter
        hasArgs = System.Text.RegularExpressions.Regex.IsMatch(
            code,
            @"static\s+(void|async\s+Task)\s+Main\s*\(\s*string\s*\[\s*\]\s+\w+"
        );

        if (className != null)
        {
            // Return code that defines the class and calls Main with appropriate signature
            var mainCall = hasArgs ? $"{className}.Main(Array.Empty<string>());" : $"{className}.Main();";
            return $@"
{code}

{mainCall}
";
        }
    }

    // For script-style code, return as-is
    return code;
}

static string FormatDiagnostic(Microsoft.CodeAnalysis.Diagnostic d, string originalCode)
{
    var lineSpan = d.Location.GetLineSpan();
    var line = lineSpan.StartLinePosition.Line + 1;
    var col = lineSpan.StartLinePosition.Character + 1;

    // Adjust line numbers for wrapped code
    var severity = d.Severity.ToString().ToLower();
    var codeId = d.Id;

    return $"({line},{col}): {severity} {codeId}: {d.GetMessage()}";
}

record ExecuteRequest
{
    public string Code { get; init; } = "";
    public int TimeoutMs { get; init; } = 30000;
    public bool CompileOnly { get; init; } = false;
}

record ExecuteResponse
{
    public bool Success { get; init; }
    public string? Output { get; init; }
    public string? Error { get; init; }
    public List<string>? Diagnostics { get; init; }
    public int ExecutionTimeMs { get; init; }
}
