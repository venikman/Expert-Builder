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

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Code Editor**: Monaco Editor with custom C# completions
- **Backend**: Express.js, Drizzle ORM
- **Database**: PostgreSQL
- **Runtime**: .NET 10 for C# code execution
- **Testing**: Vitest

## Prerequisites

- Node.js 20+
- .NET SDK 10.0+
- PostgreSQL 14+

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure database**:
   Create a PostgreSQL database and set the connection string:
   ```bash
   export DATABASE_URL="postgresql://localhost:5432/expert_builder"
   ```

3. **Push database schema**:
   ```bash
   npm run db:push
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will be available at http://localhost:5000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run check` | Type-check TypeScript |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push schema changes to database |

## Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── components/   # React components
│       │   ├── code-editor.tsx
│       │   ├── lesson-page.tsx
│       │   └── output-panel.tsx
│       └── lib/
│           └── csharp-completions.ts
├── server/               # Express backend
│   ├── routes.ts         # API endpoints
│   ├── grading.ts        # C# execution and grading logic
│   ├── storage.ts        # Database operations
│   ├── ai-tutor.ts       # Hint generation (stub)
│   └── tests/            # Backend tests
├── shared/               # Shared types
│   └── schema.ts         # Zod schemas and TypeScript types
└── vitest.config.ts      # Test configuration
```

## API Endpoints

### Learner API
- `GET /api/lessons` - List all lessons (without solutions)
- `GET /api/lessons/:id` - Get specific lesson
- `POST /api/execute` - Execute C# code (without grading)
- `POST /api/diagnostics` - Get compile-time diagnostics
- `POST /api/submit` - Submit code for grading
- `GET /api/progress` - Get learner progress
- `GET /api/progress/:lessonId` - Get progress for specific lesson

### Instructor API
- `GET /api/instructor/lessons` - List all lessons (with solutions)
- `GET /api/instructor/lessons/:id` - Get lesson with solution and tests
- `POST /api/instructor/lessons` - Create new lesson
- `PATCH /api/instructor/lessons/:id` - Update lesson
- `DELETE /api/instructor/lessons/:id` - Delete lesson

## C# Code Execution

The grading pipeline:
1. Creates an isolated temp directory for each submission
2. Writes the student code to `Program.cs`
3. Creates a `.csproj` targeting .NET 10
4. Runs `dotnet run` to execute code or `dotnet build` for diagnostics
5. Parses output to extract results or errors
6. Cleans up temp directory

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

Test coverage includes:
- Unit tests for test generation functions
- Unit tests for diagnostic parsing
- Integration tests for C# code execution
- API endpoint tests

## Lessons

Each lesson includes:
- **Content**: Markdown explanation of the concept
- **Starter Code**: Initial code template
- **Reference Solution**: Correct implementation (hidden from students)
- **Test Cases**: JSON array of test definitions
- **Hints**: Static hints for common mistakes

## Development Notes

- Uses hardcoded demo user (no authentication implemented)
- AI tutor returns static hints (no AI API integration)
- Diagnostics may include build infrastructure warnings in addition to code errors

## License

MIT
