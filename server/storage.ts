import {
  lessons, submissions,
  type Lesson, type InsertLesson,
  type SubmissionRow, type SubmissionResult
} from "@shared/schema";
// InsertLesson still needed for seedDatabase
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getLessons(): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createSubmission(lessonId: string, code: string, result: SubmissionResult): Promise<SubmissionRow>;
  getSubmissions(lessonId: string): Promise<SubmissionRow[]>;
}

export class DatabaseStorage implements IStorage {
  async getLessons(): Promise<Lesson[]> {
    const result = await db.select().from(lessons).orderBy(lessons.order);
    return result;
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createSubmission(lessonId: string, code: string, result: SubmissionResult): Promise<SubmissionRow> {
    const [submission] = await db
      .insert(submissions)
      .values({
        lessonId,
        code,
        result,
      })
      .returning();
    return submission;
  }

  async getSubmissions(lessonId: string): Promise<SubmissionRow[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.lessonId, lessonId))
      .orderBy(desc(submissions.submittedAt));
  }
}

export const storage = new DatabaseStorage();

const seedLessons: InsertLesson[] = [
  {
    id: "pure-functions",
    title: "Pure Functions",
    conceptTags: ["pure functions", "no side effects", "deterministic"],
    order: 1,
    description: `## What are Pure Functions?

A **pure function** is a function that:

1. **Always returns the same output** for the same input
2. **Has no side effects** - it doesn't modify external state

### Why Pure Functions Matter

Pure functions are the foundation of functional programming. They make code:

- **Predictable** - you always know what you'll get
- **Testable** - easy to test with simple input/output checks
- **Composable** - easy to combine with other functions

### Example

\`\`\`csharp
// Pure function - always returns the same result for same input
static int Add(int a, int b) => a + b;

// Impure function - depends on external state
static int counter = 0;
static int AddWithCounter(int a) {
    counter++; // Side effect!
    return a + counter;
}
\`\`\`

### Your Task

Implement a pure function \`Square\` that returns the square of a number.

The function should:
- Take an integer as input
- Return that integer multiplied by itself
- Have no side effects`,
    skeleton: `using System;

public class Exercise
{
    // Implement a pure function that returns the square of a number
    public static int Square(int n)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        Console.WriteLine($"Square(5) = {Square(5)}");
        Console.WriteLine($"Square(-3) = {Square(-3)}");
        Console.WriteLine($"Square(0) = {Square(0)}");
    }
}`,
    referenceSolution: `using System;

public class Exercise
{
    public static int Square(int n)
    {
        return n * n;
    }

    public static void Main()
    {
        Console.WriteLine($"Square(5) = {Square(5)}");
        Console.WriteLine($"Square(-3) = {Square(-3)}");
        Console.WriteLine($"Square(0) = {Square(0)}");
    }
}`,
    testCode: `[
  { "name": "Square(5) should return 25", "input": 5, "expected": 25 },
  { "name": "Square(-3) should return 9", "input": -3, "expected": 9 },
  { "name": "Square(0) should return 0", "input": 0, "expected": 0 },
  { "name": "Square(10) should return 100", "input": 10, "expected": 100 },
  { "name": "Square(1) should return 1", "input": 1, "expected": 1 }
]`,
    hints: {
      "Square(5) should return 25": "Remember, squaring a number means multiplying it by itself: n * n",
      "Square(-3) should return 9": "When you multiply a negative number by itself, the result is positive!",
      "Square(0) should return 0": "Zero times zero equals zero",
    },
  },
  {
    id: "map-filter",
    title: "Map and Filter with LINQ",
    conceptTags: ["LINQ", "Select", "Where", "transformations"],
    order: 2,
    description: `## Transform Collections with LINQ

LINQ (Language Integrated Query) provides functional-style operations for collections.

### Select (Map)

\`Select\` transforms each element in a collection:

\`\`\`csharp
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var doubled = numbers.Select(n => n * 2).ToList();
// Result: [2, 4, 6, 8, 10]
\`\`\`

### Where (Filter)

\`Where\` keeps only elements that match a condition:

\`\`\`csharp
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var evens = numbers.Where(n => n % 2 == 0).ToList();
// Result: [2, 4]
\`\`\`

### Chaining Operations

You can chain these operations together:

\`\`\`csharp
var result = numbers
    .Where(n => n > 2)
    .Select(n => n * 10)
    .ToList();
// Result: [30, 40, 50]
\`\`\`

### Your Task

Implement \`GetEvenSquares\` that:
1. Filters to keep only even numbers
2. Squares each remaining number
3. Returns the result as a list`,
    skeleton: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    // Filter even numbers, then square each one
    public static List<int> GetEvenSquares(List<int> numbers)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };
        var result = GetEvenSquares(numbers);
        Console.WriteLine($"[{string.Join(", ", result)}]");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    public static List<int> GetEvenSquares(List<int> numbers)
    {
        return numbers
            .Where(n => n % 2 == 0)
            .Select(n => n * n)
            .ToList();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6 };
        var result = GetEvenSquares(numbers);
        Console.WriteLine($"[{string.Join(", ", result)}]");
    }
}`,
    testCode: `[
  { "name": "Should return [4, 16, 36] for [1,2,3,4,5,6]", "input": [1,2,3,4,5,6], "expected": [4,16,36] },
  { "name": "Should return empty list for [1,3,5]", "input": [1,3,5], "expected": [] },
  { "name": "Should return [4] for [2]", "input": [2], "expected": [4] },
  { "name": "Should return empty list for empty input", "input": [], "expected": [] },
  { "name": "Should handle negative evens [-2,3,-4]", "input": [-2,3,-4], "expected": [4,16] }
]`,
    hints: {
      "Should return [4, 16, 36] for [1,2,3,4,5,6]": "Use .Where(n => n % 2 == 0) to filter even numbers, then .Select(n => n * n) to square them",
      "Should return empty list for [1,3,5]": "When no elements match the filter, the result should be an empty list",
      "Should handle negative evens [-2,3,-4]": "Remember that negative even numbers are still even! -2 % 2 == 0",
    },
  },
  {
    id: "function-composition",
    title: "Function Composition",
    conceptTags: ["composition", "higher-order functions", "Func delegates"],
    order: 3,
    description: `## Composing Functions

Function composition means combining simple functions to build more complex ones.

### The Concept

If you have:
- \`f(x)\` that transforms x
- \`g(x)\` that transforms x

Then \`compose(f, g)(x) = f(g(x))\` - apply g first, then f.

### In C#

We use \`Func<T, TResult>\` delegates:

\`\`\`csharp
Func<int, int> addOne = x => x + 1;
Func<int, int> double = x => x * 2;

// Compose: first double, then add one
Func<int, int> composed = x => addOne(double(x));

Console.WriteLine(composed(5)); // (5 * 2) + 1 = 11
\`\`\`

### Generic Compose Function

\`\`\`csharp
static Func<T, TResult> Compose<T, TMiddle, TResult>(
    Func<TMiddle, TResult> f,
    Func<T, TMiddle> g)
{
    return x => f(g(x));
}
\`\`\`

### Your Task

Implement \`Compose\` that takes two functions and returns their composition.

Given \`f\` and \`g\`, return a function that applies \`g\` first, then \`f\`.`,
    skeleton: `using System;

public class Exercise
{
    // Compose two functions: result(x) = f(g(x))
    public static Func<int, int> Compose(
        Func<int, int> f,
        Func<int, int> g)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        Func<int, int> addOne = x => x + 1;
        Func<int, int> triple = x => x * 3;

        var composed = Compose(addOne, triple);
        Console.WriteLine($"Compose(addOne, triple)(5) = {composed(5)}");
        // Expected: (5 * 3) + 1 = 16
    }
}`,
    referenceSolution: `using System;

public class Exercise
{
    public static Func<int, int> Compose(
        Func<int, int> f,
        Func<int, int> g)
    {
        return x => f(g(x));
    }

    public static void Main()
    {
        Func<int, int> addOne = x => x + 1;
        Func<int, int> triple = x => x * 3;

        var composed = Compose(addOne, triple);
        Console.WriteLine($"Compose(addOne, triple)(5) = {composed(5)}");
    }
}`,
    testCode: `[
  { "name": "Compose(addOne, double)(5) = 11", "f": "addOne", "g": "double", "input": 5, "expected": 11 },
  { "name": "Compose(double, addOne)(5) = 12", "f": "double", "g": "addOne", "input": 5, "expected": 12 },
  { "name": "Compose(square, triple)(2) = 36", "f": "square", "g": "triple", "input": 2, "expected": 36 },
  { "name": "Compose with identity returns original", "f": "identity", "g": "double", "input": 7, "expected": 14 },
  { "name": "Compose(negate, square)(3) = -9", "f": "negate", "g": "square", "input": 3, "expected": -9 }
]`,
    hints: {
      "Compose(addOne, double)(5) = 11": "Remember: Compose(f, g)(x) means apply g first, then f. So: f(g(x)) = addOne(double(5)) = addOne(10) = 11",
      "Compose(double, addOne)(5) = 12": "Order matters! double(addOne(5)) = double(6) = 12",
      "Compose(square, triple)(2) = 36": "triple(2) = 6, then square(6) = 36",
    },
  },
  {
    id: "option-type",
    title: "The Option Type Pattern",
    conceptTags: ["Option", "Maybe", "null safety", "pattern matching"],
    order: 4,
    description: `## Handling Missing Values Safely

Instead of using \`null\`, functional programming uses the **Option** type to represent values that might be missing.

### The Problem with Null

\`\`\`csharp
// Dangerous - can throw NullReferenceException!
string name = GetUserName(userId);
int length = name.Length; // Boom if null!
\`\`\`

### The Option Pattern

Option has two states:
- \`Some(value)\` - contains a value
- \`None\` - represents absence

\`\`\`csharp
public abstract record Option<T>;
public record Some<T>(T Value) : Option<T>;
public record None<T>() : Option<T>;
\`\`\`

### Safe Operations

\`\`\`csharp
Option<string> TryGetUserName(int id)
{
    if (id == 1) return new Some<string>("Alice");
    return new None<string>();
}

// Pattern matching to safely extract
var result = TryGetUserName(1) switch
{
    Some<string>(var name) => $"Hello, {name}!",
    None<string> => "User not found"
};
\`\`\`

### Your Task

Implement \`SafeDivide\` that:
- Returns \`Some(result)\` when division is valid
- Returns \`None\` when dividing by zero`,
    skeleton: `using System;

public abstract record Option<T>;
public record Some<T>(T Value) : Option<T>;
public record None<T>() : Option<T>;

public class Exercise
{
    // Return Some(a/b) if b != 0, otherwise None
    public static Option<int> SafeDivide(int a, int b)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var result1 = SafeDivide(10, 2);
        var result2 = SafeDivide(10, 0);

        Console.WriteLine(result1 switch
        {
            Some<int>(var v) => $"10 / 2 = {v}",
            None<int> => "Cannot divide by zero"
        });

        Console.WriteLine(result2 switch
        {
            Some<int>(var v) => $"10 / 0 = {v}",
            None<int> => "Cannot divide by zero"
        });
    }
}`,
    referenceSolution: `using System;

public abstract record Option<T>;
public record Some<T>(T Value) : Option<T>;
public record None<T>() : Option<T>;

public class Exercise
{
    public static Option<int> SafeDivide(int a, int b)
    {
        if (b == 0) return new None<int>();
        return new Some<int>(a / b);
    }

    public static void Main()
    {
        var result1 = SafeDivide(10, 2);
        var result2 = SafeDivide(10, 0);

        Console.WriteLine(result1 switch
        {
            Some<int>(var v) => $"10 / 2 = {v}",
            None<int> => "Cannot divide by zero"
        });

        Console.WriteLine(result2 switch
        {
            Some<int>(var v) => $"10 / 0 = {v}",
            None<int> => "Cannot divide by zero"
        });
    }
}`,
    testCode: `[
  { "name": "SafeDivide(10, 2) should return Some(5)", "a": 10, "b": 2, "expected": "Some(5)" },
  { "name": "SafeDivide(10, 0) should return None", "a": 10, "b": 0, "expected": "None" },
  { "name": "SafeDivide(0, 5) should return Some(0)", "a": 0, "b": 5, "expected": "Some(0)" },
  { "name": "SafeDivide(-10, 2) should return Some(-5)", "a": -10, "b": 2, "expected": "Some(-5)" },
  { "name": "SafeDivide(7, 3) should return Some(2)", "a": 7, "b": 3, "expected": "Some(2)" }
]`,
    hints: {
      "SafeDivide(10, 0) should return None": "Check if b == 0 before dividing. If so, return new None<int>()",
      "SafeDivide(10, 2) should return Some(5)": "When b != 0, return new Some<int>(a / b)",
      "SafeDivide(7, 3) should return Some(2)": "Integer division truncates: 7 / 3 = 2 (not 2.33...)",
    },
  },
  {
    id: "reduce-fold",
    title: "Reduce and Fold",
    conceptTags: ["Aggregate", "reduce", "fold", "accumulator"],
    order: 5,
    description: `## Reducing Collections to Single Values

**Reduce** (called \`Aggregate\` in LINQ) combines all elements of a collection into a single value.

### How It Works

\`\`\`csharp
// Sum all numbers
var numbers = new List<int> { 1, 2, 3, 4, 5 };
var sum = numbers.Aggregate(0, (acc, n) => acc + n);
// Result: 15

// The accumulator starts at 0
// Step 1: acc=0, n=1 → 0+1=1
// Step 2: acc=1, n=2 → 1+2=3
// Step 3: acc=3, n=3 → 3+3=6
// Step 4: acc=6, n=4 → 6+4=10
// Step 5: acc=10, n=5 → 10+5=15
\`\`\`

### Common Uses

\`\`\`csharp
// Product of all numbers
var product = numbers.Aggregate(1, (acc, n) => acc * n);

// Find maximum
var max = numbers.Aggregate((acc, n) => n > acc ? n : acc);

// Concatenate strings
var words = new List<string> { "Hello", "World" };
var sentence = words.Aggregate((acc, w) => acc + " " + w);
\`\`\`

### Your Task

Implement \`Product\` that multiplies all numbers in a list.
Return 1 for an empty list (identity for multiplication).`,
    skeleton: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    // Return the product of all numbers in the list
    // For empty list, return 1
    public static int Product(List<int> numbers)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var nums1 = new List<int> { 1, 2, 3, 4, 5 };
        var nums2 = new List<int>();
        var nums3 = new List<int> { 7 };

        Console.WriteLine($"Product([1,2,3,4,5]) = {Product(nums1)}");
        Console.WriteLine($"Product([]) = {Product(nums2)}");
        Console.WriteLine($"Product([7]) = {Product(nums3)}");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    public static int Product(List<int> numbers)
    {
        return numbers.Aggregate(1, (acc, n) => acc * n);
    }

    public static void Main()
    {
        var nums1 = new List<int> { 1, 2, 3, 4, 5 };
        var nums2 = new List<int>();
        var nums3 = new List<int> { 7 };

        Console.WriteLine($"Product([1,2,3,4,5]) = {Product(nums1)}");
        Console.WriteLine($"Product([]) = {Product(nums2)}");
        Console.WriteLine($"Product([7]) = {Product(nums3)}");
    }
}`,
    testCode: `[
  { "name": "Product([1,2,3,4,5]) should return 120", "input": [1,2,3,4,5], "expected": 120 },
  { "name": "Product([]) should return 1", "input": [], "expected": 1 },
  { "name": "Product([7]) should return 7", "input": [7], "expected": 7 },
  { "name": "Product([2,3,4]) should return 24", "input": [2,3,4], "expected": 24 },
  { "name": "Product([1,0,5]) should return 0", "input": [1,0,5], "expected": 0 }
]`,
    hints: {
      "Product([1,2,3,4,5]) should return 120": "Use .Aggregate(1, (acc, n) => acc * n) - start with 1 as the identity for multiplication",
      "Product([]) should return 1": "With Aggregate(1, ...), an empty list returns the seed value 1",
      "Product([1,0,5]) should return 0": "Any list containing 0 will have a product of 0",
    },
  },
];

export async function seedDatabase(): Promise<void> {
  const existingLessons = await db.select().from(lessons);
  if (existingLessons.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with lessons...");

  for (const lesson of seedLessons) {
    await db.insert(lessons).values(lesson);
  }

  console.log("Database seeded successfully!");
}
