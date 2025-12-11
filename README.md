# Expert Builder - FP-Style C# Learning Platform

An auto-graded learning platform for modern C# with a focus on functional programming patterns. Built with React, TypeScript, and Monaco Editor.

## Features

- **Interactive Lessons**: 5 FP-oriented C# exercises covering:
  - Pure Functions
  - Map and Filter (LINQ)
  - Function Composition
  - Option Types (Maybe monad)
  - Reduce/Fold patterns

- **Monaco Code Editor** with:
  - C# syntax highlighting
  - Custom FP-focused completions (LINQ methods, lambdas, etc.)
  - Real-time diagnostics (compile errors/warnings)
  - Keyboard shortcuts (Ctrl+Enter to Run, Ctrl+Shift+Enter to Submit)

- **Auto-Grading Pipeline**:
  - Compiles and runs C# code in isolated temporary directories
  - Runs test cases against student submissions
  - Provides personalized hints on failures
  - Tracks learner progress

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Code Editor**: Monaco Editor with custom C# completions
- **Backend**: Hono (TypeScript)
- **Runtime**: Bun + .NET 9 (Roslyn Scripting API) for C# code execution
- **Testing**: Bun test

## Prerequisites

- Bun 1.0+
- .NET SDK 9.0+

### Installing .NET 9 SDK

The RoslynRunner targets `net9.0`. On Ubuntu 22.04:

```bash
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O /tmp/msprod.deb
sudo dpkg -i /tmp/msprod.deb
sudo apt update
sudo apt install -y dotnet-sdk-9.0
```

The repo includes a `global.json` that pins the SDK version to ensure CI/CLI picks the correct one.

> **Note:** If your environment only offers .NET 8, you can temporarily retarget the runner to `net8.0` in `roslyn-runner/RoslynRunner.csproj`. However, installing SDK 9 is preferred to stay aligned with the ADR.

## Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start development server**:
   ```bash
   bun run dev
   ```

   The app will be available at http://localhost:5000

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build for production |
| `bun run start` | Run production build |
| `bun run check` | Type-check TypeScript |
| `bun test` | Run test suite |

## Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── components/   # React components
│       │   ├── uuuu-editor.tsx
│       │   ├── lesson-page.tsx
│       │   └── output-panel.tsx
│       └── lib/
│           └── csharp-completions.ts
├── server/               # Hono backend
│   ├── routes.ts         # API endpoints
│   ├── grading.ts        # C# execution and grading logic
│   ├── storage.ts        # Lesson data access
│   └── tests/            # Backend tests
├── roslyn-runner/        # Persistent .NET code executor
│   └── Program.cs        # Roslyn Scripting API runner
└── shared/               # Shared types
    └── schema.ts         # Zod schemas and TypeScript types
```

## API Endpoints

- `GET /api/lessons` - List all lessons
- `GET /api/lessons/:id` - Get specific lesson
- `POST /api/execute` - Execute C# code
- `POST /api/diagnostics` - Get compile-time diagnostics
- `POST /api/submit` - Submit code for grading

## C# Code Execution

The grading pipeline uses a persistent Roslyn Scripting API runner for fast execution (~30-150ms):

1. Server sends code to the Roslyn runner via stdin/stdout JSON protocol
2. Runner compiles and executes using Roslyn Scripting API (warm context)
3. Captures console output and compiler diagnostics
4. Returns results as JSON response

See [ADR-001](docs/adr/001-roslyn-runner-for-code-execution.md) for architecture details.

## Running Tests

```bash
bun test
```

Test coverage includes:
- Integration tests for C# code execution
- Multi-class code execution tests
- Security/sandboxing tests

## Lessons

Each lesson includes:
- **Content**: Markdown explanation of the concept
- **Starter Code**: Initial code template
- **Reference Solution**: Correct implementation (hidden from students)
- **Test Cases**: JSON array of test definitions
- **Hints**: Static hints for common mistakes

## Development Notes

- Lessons are stored as static TypeScript data
- Hints are provided inline in grading logic
- Diagnostics come from Roslyn compiler

## License

MIT
