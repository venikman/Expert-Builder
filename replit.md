# FP C# Academy

## Overview

FP C# Academy is an interactive learning platform for teaching functional programming concepts in C#. The application provides a browser-based environment where learners can read lesson content, view animated concept visualizations, write C# code in an integrated editor, and receive automated grading on their submissions.

The platform focuses on FP-style C# patterns including pure functions, immutability, function composition, LINQ, and Option/Either type patterns. Each lesson contains markdown documentation, concept animations, code exercises with skeleton templates, and hidden test suites for auto-grading.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom build configuration
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Code Editor**: Monaco Editor (@monaco-editor/react) for C# syntax highlighting and editing
- **Typography**: Inter for UI text, JetBrains Mono for code

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Design**: RESTful JSON API under `/api/*` prefix
- **Code Execution**: Spawns child processes to compile and run C# code in isolated temp directories
- **Build Process**: Custom esbuild script bundles server with selective dependency bundling for faster cold starts

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains database table definitions and Zod validation schemas
- **Storage Pattern**: Interface-based storage abstraction (`IStorage`) with in-memory implementation for lessons
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)

### Key Design Patterns
- **Shared Types**: The `shared/` directory contains schema definitions used by both frontend and backend, ensuring type safety across the stack
- **Path Aliases**: TypeScript path aliases (`@/` for client, `@shared/` for shared code) simplify imports
- **Resizable Panels**: Split-pane layout using react-resizable-panels for lesson content, animation canvas, and code editor
- **Theme System**: CSS custom properties enable seamless light/dark theme switching

### Application Flow
1. Lessons are fetched from `/api/lessons` and displayed in a navigable interface
2. Each lesson shows markdown content, concept tags, and an embedded animation canvas
3. Learners write C# code in the Monaco editor with the provided skeleton
4. "Run" executes code and displays stdout/stderr in console pane
5. "Submit" runs hidden test suite and returns pass/fail results with hints

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Session Storage**: connect-pg-simple for Express session persistence

### Frontend Libraries
- **Monaco Editor**: Browser-based code editor with C# language support
- **React Markdown**: Renders lesson content with GitHub Flavored Markdown (remark-gfm)
- **Embla Carousel**: Powers carousel components in the UI library

### Development Tools
- **Replit Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner for Replit-specific development experience

### C# Execution
- The backend requires .NET runtime available in the environment to compile and execute learner C# code submissions