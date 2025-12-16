# Expert Builder Coding Standards

This document defines mandatory coding standards for the Expert Builder project.

## C# Code Standards

### Async/Await

**RULE: Never use `async void` - always use `async Task`**

`async void` methods are fire-and-forget and cannot be awaited. Exceptions thrown within them cannot be caught by the caller, leading to unreliable behavior and potential crashes.

```csharp
// BAD - async void
public static async void Main()
{
    await DoSomethingAsync();
}

// GOOD - async Task
public static async Task Main()
{
    await DoSomethingAsync();
}
```

This applies to:
- Entry point `Main` methods
- Event handlers (use `async Task` and handle exceptions internally)
- Any asynchronous method that should be awaited

### Naming Conventions

- Use `camelCase` for local variables and parameters
- Use `PascalCase` for public members, classes, and methods
- Use `_camelCase` for private fields

```csharp
// BAD
var code_id = "CS1001";

// GOOD
var codeId = "CS1001";
```

### Method Signatures

When defining `Main` methods, support both standard signatures:

```csharp
// No args version
public static void Main()

// With args version
public static void Main(string[] args)

// Async versions
public static async Task Main()
public static async Task Main(string[] args)
```

## TypeScript Code Standards

### Timer Cleanup

Always clear timeouts when they are no longer needed to prevent memory leaks and unexpected behavior:

```typescript
// BAD - timeout not cleared
setTimeout(() => {
  if (!ready) reject(new Error("Timeout"));
}, 30000);

// GOOD - timeout cleared when resolved
let timeoutId = setTimeout(() => {
  if (!ready) reject(new Error("Timeout"));
}, 30000);

// Later, when resolved:
clearTimeout(timeoutId);
```

### Type Safety

- Avoid `any` types where possible
- Use proper interfaces for API responses
- Validate external data at boundaries

## Documentation Standards

### ADRs (Architecture Decision Records)

- Keep implementation details consistent with documentation
- Update ADRs when implementation changes
- Include accurate version numbers (e.g., .NET 10)

## Testing Standards

### Test Code

Test code should follow the same standards as production code:
- Use `async Task Main()` not `async void Main()` in test C# code
- Ensure tests can properly await async operations
- Tests should verify behavior, not just that code doesn't crash
