using System.Diagnostics;
using System.Text;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Pre-warm Roslyn on startup
var warmupTask = Task.Run(async () =>
{
    var sw = Stopwatch.StartNew();
    try
    {
        await CSharpScript.EvaluateAsync("1 + 1", ScriptOptions.Default);
        Console.WriteLine($"[Roslyn] Warmed up in {sw.ElapsedMilliseconds}ms");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Roslyn] Warmup failed: {ex.Message}");
    }
});

// Shared script options with common imports
var scriptOptions = ScriptOptions.Default
    .WithImports(
        "System",
        "System.Collections.Generic",
        "System.Linq",
        "System.Text"
    )
    .WithReferences(
        typeof(object).Assembly,
        typeof(Console).Assembly,
        typeof(Enumerable).Assembly
    );

app.MapPost("/execute", async (ExecuteRequest request) =>
{
    var sw = Stopwatch.StartNew();
    var output = new StringBuilder();
    var errors = new StringBuilder();

    try
    {
        // Capture Console.WriteLine output
        var originalOut = Console.Out;
        var originalErr = Console.Error;

        using var outWriter = new StringWriter(output);
        using var errWriter = new StringWriter(errors);

        Console.SetOut(outWriter);
        Console.SetError(errWriter);

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(request.TimeoutSeconds ?? 5));

            // Wrap user code to handle both expressions and statements
            var code = WrapCode(request.Code);

            await CSharpScript.EvaluateAsync(
                code,
                scriptOptions,
                cancellationToken: cts.Token
            );
        }
        finally
        {
            Console.SetOut(originalOut);
            Console.SetError(originalErr);
        }

        return Results.Ok(new ExecuteResponse(
            Success: true,
            Output: output.ToString(),
            Error: errors.Length > 0 ? errors.ToString() : null,
            ExecutionTimeMs: sw.ElapsedMilliseconds
        ));
    }
    catch (CompilationErrorException ex)
    {
        var diagnostics = ex.Diagnostics
            .Select(d => new DiagnosticInfo(
                Line: d.Location.GetLineSpan().StartLinePosition.Line + 1,
                Column: d.Location.GetLineSpan().StartLinePosition.Character + 1,
                Severity: d.Severity.ToString().ToLower(),
                Message: d.GetMessage(),
                Code: d.Id
            ))
            .ToArray();

        return Results.Ok(new ExecuteResponse(
            Success: false,
            Output: output.ToString(),
            Error: string.Join("\n", ex.Diagnostics.Select(d => d.GetMessage())),
            ExecutionTimeMs: sw.ElapsedMilliseconds,
            Diagnostics: diagnostics
        ));
    }
    catch (OperationCanceledException)
    {
        return Results.Ok(new ExecuteResponse(
            Success: false,
            Output: output.ToString(),
            Error: "Execution timed out",
            ExecutionTimeMs: sw.ElapsedMilliseconds
        ));
    }
    catch (Exception ex)
    {
        return Results.Ok(new ExecuteResponse(
            Success: false,
            Output: output.ToString(),
            Error: ex.Message,
            ExecutionTimeMs: sw.ElapsedMilliseconds
        ));
    }
});

app.MapPost("/diagnostics", async (DiagnosticsRequest request) =>
{
    var sw = Stopwatch.StartNew();

    try
    {
        var code = WrapCode(request.Code);
        var script = CSharpScript.Create(code, scriptOptions);
        var compilation = script.GetCompilation();

        var diagnostics = compilation.GetDiagnostics()
            .Where(d => d.Severity >= Microsoft.CodeAnalysis.DiagnosticSeverity.Warning)
            .Select(d => new DiagnosticInfo(
                Line: d.Location.GetLineSpan().StartLinePosition.Line + 1,
                Column: d.Location.GetLineSpan().StartLinePosition.Character + 1,
                Severity: d.Severity.ToString().ToLower(),
                Message: d.GetMessage(),
                Code: d.Id
            ))
            .ToArray();

        return Results.Ok(new DiagnosticsResponse(
            Diagnostics: diagnostics,
            ExecutionTimeMs: sw.ElapsedMilliseconds
        ));
    }
    catch (Exception ex)
    {
        return Results.Ok(new DiagnosticsResponse(
            Diagnostics: [new DiagnosticInfo(1, 1, "error", ex.Message, "EX0001")],
            ExecutionTimeMs: sw.ElapsedMilliseconds
        ));
    }
});

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

await warmupTask;
app.Run();

// Wrap code that contains class definitions to be executable as a script
static string WrapCode(string code)
{
    // If code has a Main method, extract and call it
    if (code.Contains("static void Main") || code.Contains("static async Task Main"))
    {
        // For full programs with Main, we need to find and invoke Main
        return $$"""
            {{code}}

            // Find and invoke Main
            var types = new[] { typeof(Program), typeof(Exercise) }
                .Concat(AppDomain.CurrentDomain.GetAssemblies()
                    .SelectMany(a => { try { return a.GetTypes(); } catch { return Array.Empty<Type>(); } }))
                .Where(t => t != null);

            foreach (var type in types)
            {
                var main = type.GetMethod("Main",
                    System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
                if (main != null)
                {
                    var result = main.Invoke(null, main.GetParameters().Length > 0 ? new object[] { Array.Empty<string>() } : null);
                    if (result is Task task) await task;
                    break;
                }
            }
            """;
    }

    return code;
}

record ExecuteRequest(string Code, int? TimeoutSeconds = 5);
record ExecuteResponse(bool Success, string Output, string? Error, long ExecutionTimeMs, DiagnosticInfo[]? Diagnostics = null);
record DiagnosticsRequest(string Code);
record DiagnosticsResponse(DiagnosticInfo[] Diagnostics, long ExecutionTimeMs);
record DiagnosticInfo(int Line, int Column, string Severity, string Message, string Code);
