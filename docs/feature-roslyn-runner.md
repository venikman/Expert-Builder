# Feature: Persistent Roslyn Runner for Fast C# Execution

## FPF Metadata

| Attribute | Value |
|-----------|-------|
| **F (Formality)** | F2 - Structured outline with template |
| **G (Scope)** | {Expert-Builder, feature specification, implementation guide} |
| **R (Reliability)** | 0.80 - Specification, not yet fully implemented/tested |
| **Bounded Context** | Code Execution Subsystem |
| **Holon Level** | Feature (child of Expert-Builder system) |
| **Evidence** | ADR-001, Roslyn API docs, local benchmarks |

## Glossary (Bounded Context Terms)

| Term | Definition |
|------|------------|
| **Roslyn Runner** | Persistent .NET process using Roslyn Scripting API |
| **Warm execution** | Code execution after initial Roslyn compilation cache is populated |
| **Cold start** | First execution requiring full Roslyn initialization (~2s) |
| **Test harness** | Generated wrapper code that calls user's solution with test inputs |
| **Script-style code** | C# top-level statements without explicit class/Main |

## Overview

Replace the slow `dotnet run` execution model with a persistent Roslyn Scripting API runner to achieve sub-200ms code execution times.

## Problem Statement

Users experience 14+ second delays when running or submitting C# code in lessons. This latency breaks the interactive learning experience and makes the platform frustrating to use.

## Goals

1. Reduce code execution time from ~14 seconds to under 200ms
2. Maintain full compatibility with existing lessons and test harnesses
3. Provide accurate compiler diagnostics for real-time error feedback
4. Support both script-style and class-based C# code

## Non-Goals

- Sandboxing/security isolation (trusted user environment)
- Multi-tenant execution (single-user focus for now)
- Support for NuGet packages in user code

## User Stories

### US-1: Fast Code Execution
**As a** learner
**I want** my code to run quickly when I click "Run"
**So that** I can iterate rapidly while learning

**Acceptance Criteria:**
- Code execution completes in under 200ms (after warm-up)
- Console output is displayed in the output panel
- Execution time is shown to the user

### US-2: Real-time Diagnostics
**As a** learner
**I want** to see compiler errors as I type
**So that** I can fix syntax errors before running

**Acceptance Criteria:**
- Compiler errors appear within 2 seconds of typing
- Error locations (line, column) are accurate
- Error messages are helpful and actionable

### US-3: Test Submission
**As a** learner
**I want** to submit my solution and see test results quickly
**So that** I know if my implementation is correct

**Acceptance Criteria:**
- All tests run in under 1 second total
- Pass/fail status shown for each test
- Helpful hints provided for failed tests

### US-4: Code with Main Method
**As a** learner
**I want** to write code with a `Main()` method
**So that** I can practice standard C# program structure

**Acceptance Criteria:**
- Code with `public static void Main()` executes correctly
- Output from `Console.WriteLine` in Main is captured
- Class-based code structure is preserved

### US-5: Script-style Code
**As a** learner
**I want** to write simple one-liner code
**So that** I can quickly test expressions

**Acceptance Criteria:**
- Top-level statements execute directly (e.g., `Console.WriteLine(42);`)
- No boilerplate required for simple experiments

### US-6: Multi-Class Code Execution
**As a** learner
**I want** to write code with 50+ classes across multiple files or in a single file
**So that** I can practice real-world application architecture patterns

**Acceptance Criteria:**
- Code with multiple class definitions compiles and executes correctly
- Classes can reference each other (inheritance, composition, dependencies)
- Nested classes and partial classes are supported
- Generic classes with type parameters work correctly
- Abstract classes and interfaces can be implemented
- Execution completes in under 500ms for complex multi-class code
- Compiler errors correctly identify the class and line where issues occur

### US-7: Protection from Code Injection Attacks
**As a** platform operator
**I want** user code to be isolated from system resources
**So that** malicious code cannot compromise the platform or other users

**Acceptance Criteria:**
- File system access is restricted (no reading/writing arbitrary files)
- Network access is blocked (no outbound HTTP, sockets, etc.)
- Process spawning is prevented (no `Process.Start`, `Shell`, etc.)
- Reflection-based attacks are mitigated (no loading external assemblies)
- Environment variables and secrets are not accessible
- Infinite loops and resource exhaustion are handled via timeouts
- Memory allocation is bounded to prevent OOM attacks
- No external data access from user code
- Code cannot escape the Roslyn scripting sandbox

## Technical Specification

### Components

#### 1. Roslyn Runner (`roslyn-runner/`)

A .NET 9 console application that:
- Initializes Roslyn Scripting API on startup
- Listens for JSON requests on stdin
- Executes C# code using `CSharpScript.Create().RunAsync()`
- Returns JSON responses on stdout

**Key Features:**
- Warm-up compilation on startup
- Configurable timeout per request
- Console output capture
- Diagnostic extraction for compile errors

#### 2. Grading Service (`server/grading.ts`)

Updated to:
- Spawn Roslyn runner as a child process
- Communicate via stdin/stdout JSON protocol
- Handle runner lifecycle (start, restart on crash)
- Parse responses and return to API handlers

#### 3. API Endpoints

No changes to API contract:
- `POST /api/execute` - Run code, return output
- `POST /api/diagnostics` - Compile code, return errors
- `POST /api/submit` - Run tests, return results

### Data Flow

```
User clicks "Run"
       │
       ▼
┌─────────────────┐
│  Code Editor    │
│  (React)        │
└────────┬────────┘
         │ POST /api/execute
         ▼
┌─────────────────┐
│  Hono Server    │
│  (routes.ts)    │
└────────┬────────┘
         │ executeCode()
         ▼
┌─────────────────┐     stdin (JSON)      ┌─────────────────┐
│  grading.ts     │ ──────────────────►   │  Roslyn Runner  │
│                 │ ◄──────────────────   │  (Program.cs)   │
└────────┬────────┘     stdout (JSON)     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  JSON Response  │
│  to Client      │
└─────────────────┘
```

### Request/Response Format

**Execute Request:**
```json
{
  "Code": "public class X { public static void Main() { Console.WriteLine(1); } }",
  "TimeoutMs": 30000
}
```

**Execute Response:**
```json
{
  "Success": true,
  "Output": "1\n",
  "Error": null,
  "Diagnostics": null,
  "ExecutionTimeMs": 45
}
```

**Error Response:**
```json
{
  "Success": false,
  "Output": "",
  "Error": "(1,10): error CS1002: ; expected",
  "Diagnostics": ["(1,10): error CS1002: ; expected"],
  "ExecutionTimeMs": 12
}
```

## Test Plan

### Unit Tests

1. **Main method detection** - Verify regex correctly identifies Main methods
2. **Code wrapping** - Verify TestRunner.Main() is called for test harnesses
3. **Diagnostic parsing** - Verify error messages are correctly extracted

### Integration Tests

1. **Simple execution** - `Console.WriteLine(42)` returns "42"
2. **Class-based code** - Exercise class with Main executes correctly
3. **Compile errors** - Missing semicolon returns appropriate diagnostic
4. **Timeout** - Infinite loop times out after specified duration
5. **All lesson types** - Each lesson's reference solution passes all tests

### Performance Tests

1. **Cold start** - First execution under 3 seconds
2. **Warm execution** - Subsequent executions under 200ms
3. **Test suite** - 5 tests complete under 1 second

## Rollout Plan

1. **Development** - Test locally with `bun run dev`
2. **PR Review** - Code review and CI checks
3. **Staging** - Deploy to staging environment on Fly.io
4. **Production** - Deploy to production after staging validation

## Monitoring

- Log execution times for each request
- Log runner restarts
- Monitor memory usage of runner process

## Future Enhancements

1. **Runner pool** - Multiple runner instances for concurrent requests
2. **NuGet support** - Allow specific packages in user code
3. **.NET 10 migration** - Use `dotnet run app.cs` when stable
4. **Execution caching** - Cache compiled scripts for repeated runs
