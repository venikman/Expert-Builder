# ADR-001: Persistent Roslyn Runner for C# Code Execution

## FPF Metadata

| Attribute | Value |
|-----------|-------|
| **F (Formality)** | F3 - Controlled narrative with structured constraints |
| **G (Scope)** | {Expert-Builder, C# execution, learning platforms} |
| **R (Reliability)** | 0.85 - Based on Roslyn docs, measured benchmarks, working implementation |
| **Bounded Context** | Code Execution Subsystem |
| **Holon Level** | Component (part of Expert-Builder system) |

## Status

Accepted

## Context

Expert Builder is a learning platform that executes user-submitted C# code for interactive lessons. The original implementation used `dotnet run` to compile and execute code on each request.

### Problem

In production (Fly.io deployment), each code execution took **~14 seconds** due to:

1. **Cold start overhead**: `dotnet run` performs full project restore, compilation, and execution
2. **No caching**: Each request creates a new temp directory, project file, and compilation context
3. **Process spawning**: New process for every execution adds OS-level overhead

This latency made the platform unusable for interactive learning where users expect sub-second feedback.

### Requirements

- Execution time under 500ms for typical code snippets
- Support for class-based C# code with `Main()` methods
- Support for script-style code (top-level statements)
- Compiler diagnostics for real-time error feedback
- Timeout enforcement for infinite loops/long-running code
- No changes to existing lesson structure or test harness

## Decision

Implement a **persistent Roslyn Scripting API runner** as a background service that:

1. Starts once at application boot
2. Warms up Roslyn compiler on startup (~2 seconds)
3. Accepts code execution requests via stdin/stdout JSON protocol
4. Reuses the warm Roslyn context for subsequent compilations

### Architecture

```
┌─────────────────┐      JSON/stdin       ┌──────────────────┐
│   Bun Server    │ ──────────────────►   │  Roslyn Runner   │
│  (grading.ts)   │ ◄──────────────────   │  (.NET 10 App)   │
└─────────────────┘      JSON/stdout      └──────────────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ Microsoft.Code   │
                                          │ Analysis.CSharp  │
                                          │ .Scripting       │
                                          └──────────────────┘
```

### Communication Protocol

**Request** (JSON, one per line):
```json
{
  "Code": "Console.WriteLine(42);",
  "TimeoutMs": 30000
}
```

**Response** (JSON, one per line):
```json
{
  "Success": true,
  "Output": "42\n",
  "Error": null,
  "Diagnostics": null,
  "ExecutionTimeMs": 45
}
```

### Code Handling

The runner supports two code styles:

1. **Script-style** (top-level statements):
   ```csharp
   Console.WriteLine("Hello");
   ```

2. **Class-based** (with Main method):
   ```csharp
   public class Exercise {
       public static void Main() {
           Console.WriteLine("Hello");
       }
   }
   ```

For class-based code, the runner appends a call to invoke `Main()`:
- Prioritizes `TestRunner.Main()` if present (for test harnesses)
- Otherwise finds the class containing the `Main` method

## Alternatives Considered

### 1. dotnet-script Tool

**Pros**: Mature, well-tested, supports caching

**Cons**:
- Additional dependency to manage
- Still has cold-start overhead per execution
- Less control over execution environment

### 2. Pre-warmed Container Pool

**Pros**: Complete isolation, scalable

**Cons**:
- High infrastructure complexity
- Significant cost for maintaining warm containers
- Overkill for a learning platform

### 3. `dotnet run app.cs` (single-file execution)

**Pros**: Official solution, simple

**Cons**:
- Still incurs per-execution compilation overhead
- Less control over execution context

**Note**: We use .NET 10 as the runtime and leverage Roslyn Scripting API for persistent warm execution rather than `dotnet run app.cs` per-request.

### 4. WebAssembly (Blazor)

**Pros**: Client-side execution, no server load

**Cons**:
- Large download size (~30MB)
- Limited .NET API surface in WASM
- Complex integration with existing architecture

## Consequences

### Positive

- **Performance**: 14,000ms → 30-150ms execution time (99% improvement)
- **User Experience**: Near-instant feedback enables interactive learning
- **Simplicity**: Single background process, no external dependencies
- **Maintainability**: Standard .NET project, easy to debug and extend

### Negative

- **Memory**: Roslyn compiler stays in memory (~100-200MB)
- **State**: Single runner process could accumulate state (mitigated by script isolation)
- **Startup**: ~2 second warm-up on first request after deploy
- **Complexity**: Additional component to deploy and monitor

### Risks

1. **Runner crashes**: If the Roslyn runner crashes, the server will attempt to restart it on next request
2. **Memory leaks**: Long-running Roslyn sessions could leak memory; monitor and restart periodically if needed
3. **Security**: User code runs in-process; currently acceptable for a learning platform with trusted users

## Implementation

### Files Added/Modified

- `roslyn-runner/Program.cs` - Roslyn runner application
- `roslyn-runner/RoslynRunner.csproj` - .NET 10 project file
- `server/grading.ts` - Updated to use runner via stdin/stdout
- `Dockerfile` - Build and include Roslyn runner

### Performance Results

| Scenario | Before | After |
|----------|--------|-------|
| Cold start (first request) | ~14,000ms | ~2,000ms |
| Warm execution | ~14,000ms | 30-150ms |
| Test suite (5 tests) | ~70,000ms | ~500ms |

## References

- [Roslyn Scripting API Samples](https://github.com/dotnet/roslyn/blob/main/docs/wiki/Scripting-API-Samples.md)
- [Runtime C# Code Compilation with Roslyn](https://weblog.west-wind.com/posts/2022/Jun/07/Runtime-C-Code-Compilation-Revisited-for-Roslyn)
- [dotnet-script project](https://github.com/dotnet-script/dotnet-script)
