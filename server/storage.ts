import { 
  users, lessons, lessonAnimations, submissions, learnerProgress,
  type User, type InsertUser, type Lesson, type InsertLesson,
  type LessonAnimation, type LessonAnimationRow, type InsertLessonAnimation,
  type SubmissionRow, type InsertSubmission, type SubmissionResult,
  type LearnerProgress, type InsertLearnerProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getLessons(): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined>;
  deleteLesson(id: string): Promise<boolean>;
  getLessonAnimation(lessonId: string): Promise<LessonAnimation | undefined>;
  createLessonAnimation(animation: InsertLessonAnimation): Promise<LessonAnimationRow>;
  updateLessonAnimation(lessonId: string, animation: Partial<InsertLessonAnimation>): Promise<LessonAnimationRow | undefined>;
  createSubmission(lessonId: string, code: string, result: SubmissionResult, userId?: number): Promise<SubmissionRow>;
  getSubmissions(lessonId: string): Promise<SubmissionRow[]>;
  getUserSubmissions(userId: number): Promise<SubmissionRow[]>;
  getLearnerProgress(userId: number): Promise<LearnerProgress[]>;
  getLessonProgress(userId: number, lessonId: string): Promise<LearnerProgress | undefined>;
  updateLearnerProgress(userId: number, lessonId: string, data: Partial<InsertLearnerProgress>): Promise<LearnerProgress>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getLessons(): Promise<Lesson[]> {
    const result = await db.select().from(lessons).orderBy(lessons.order);
    return result;
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson || undefined;
  }

  async createLesson(lesson: InsertLesson): Promise<Lesson> {
    const [created] = await db.insert(lessons).values(lesson).returning();
    return created;
  }

  async updateLesson(id: string, lesson: Partial<InsertLesson>): Promise<Lesson | undefined> {
    const [updated] = await db
      .update(lessons)
      .set({ ...lesson, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteLesson(id: string): Promise<boolean> {
    const result = await db.delete(lessons).where(eq(lessons.id, id));
    return true;
  }

  async getLessonAnimation(lessonId: string): Promise<LessonAnimation | undefined> {
    const [animation] = await db
      .select()
      .from(lessonAnimations)
      .where(eq(lessonAnimations.lessonId, lessonId));
    
    if (!animation) return undefined;
    
    return {
      sceneData: animation.sceneData as Record<string, any>,
      steps: animation.steps as any[],
    };
  }

  async createLessonAnimation(animation: InsertLessonAnimation): Promise<LessonAnimationRow> {
    const [created] = await db.insert(lessonAnimations).values(animation).returning();
    return created;
  }

  async updateLessonAnimation(lessonId: string, animation: Partial<InsertLessonAnimation>): Promise<LessonAnimationRow | undefined> {
    const [updated] = await db
      .update(lessonAnimations)
      .set(animation)
      .where(eq(lessonAnimations.lessonId, lessonId))
      .returning();
    return updated || undefined;
  }

  async createSubmission(lessonId: string, code: string, result: SubmissionResult, userId?: number): Promise<SubmissionRow> {
    const [submission] = await db
      .insert(submissions)
      .values({
        lessonId,
        code,
        result,
        userId: userId || null,
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

  async getUserSubmissions(userId: number): Promise<SubmissionRow[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, userId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getLearnerProgress(userId: number): Promise<LearnerProgress[]> {
    return db
      .select()
      .from(learnerProgress)
      .where(eq(learnerProgress.userId, userId));
  }

  async getLessonProgress(userId: number, lessonId: string): Promise<LearnerProgress | undefined> {
    const [progress] = await db
      .select()
      .from(learnerProgress)
      .where(and(
        eq(learnerProgress.userId, userId),
        eq(learnerProgress.lessonId, lessonId)
      ));
    return progress || undefined;
  }

  async updateLearnerProgress(userId: number, lessonId: string, data: Partial<InsertLearnerProgress>): Promise<LearnerProgress> {
    const existing = await this.getLessonProgress(userId, lessonId);
    
    if (existing) {
      const [updated] = await db
        .update(learnerProgress)
        .set(data)
        .where(eq(learnerProgress.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(learnerProgress)
      .values({
        userId,
        lessonId,
        ...data,
      })
      .returning();
    return created;
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

const seedAnimations: InsertLessonAnimation[] = [
  {
    lessonId: "pure-functions",
    sceneData: {
      shapes: [
        { id: "input-box", type: "box", x: 50, y: 120, width: 60, height: 40, label: "5", color: "rgba(59, 130, 246, 0.2)" },
        { id: "function-box", type: "function", x: 160, y: 100, width: 80, height: 80, label: "Square", color: "rgba(34, 197, 94, 0.2)" },
        { id: "output-box", type: "box", x: 290, y: 120, width: 60, height: 40, label: "25", color: "rgba(168, 85, 247, 0.2)" },
        { id: "arrow1", type: "arrow", x: 110, y: 140, width: 50, height: 0, label: "", color: "" },
        { id: "arrow2", type: "arrow", x: 240, y: 140, width: 50, height: 0, label: "", color: "" },
        { id: "title", type: "text", x: 200, y: 50, width: 0, height: 0, label: "Pure Function: Same input → Same output", color: "" },
        { id: "note", type: "text", x: 200, y: 220, width: 0, height: 0, label: "No side effects!", color: "" },
      ],
    },
    steps: [
      { type: "highlight", target: "title", duration: 1000 },
      { type: "highlight", target: "input-box", duration: 800 },
      { type: "highlight", target: "arrow1", duration: 600 },
      { type: "highlight", target: "function-box", duration: 1000 },
      { type: "highlight", target: "arrow2", duration: 600 },
      { type: "highlight", target: "output-box", duration: 800 },
      { type: "highlight", target: "note", duration: 1000 },
    ],
  },
  {
    lessonId: "map-filter",
    sceneData: {
      shapes: [
        { id: "input-label", type: "text", x: 60, y: 40, width: 0, height: 0, label: "Input: [1, 2, 3, 4, 5, 6]", color: "" },
        { id: "box1", type: "box", x: 20, y: 60, width: 30, height: 30, label: "1", color: "rgba(156, 163, 175, 0.3)" },
        { id: "box2", type: "box", x: 55, y: 60, width: 30, height: 30, label: "2", color: "rgba(59, 130, 246, 0.3)" },
        { id: "box3", type: "box", x: 90, y: 60, width: 30, height: 30, label: "3", color: "rgba(156, 163, 175, 0.3)" },
        { id: "box4", type: "box", x: 125, y: 60, width: 30, height: 30, label: "4", color: "rgba(59, 130, 246, 0.3)" },
        { id: "box5", type: "box", x: 160, y: 60, width: 30, height: 30, label: "5", color: "rgba(156, 163, 175, 0.3)" },
        { id: "box6", type: "box", x: 195, y: 60, width: 30, height: 30, label: "6", color: "rgba(59, 130, 246, 0.3)" },
        { id: "filter-fn", type: "function", x: 260, y: 55, width: 100, height: 40, label: ".Where(even)", color: "rgba(245, 158, 11, 0.2)" },
        { id: "filtered-label", type: "text", x: 80, y: 140, width: 0, height: 0, label: "After filter: [2, 4, 6]", color: "" },
        { id: "f-box2", type: "box", x: 55, y: 160, width: 30, height: 30, label: "2", color: "rgba(59, 130, 246, 0.3)" },
        { id: "f-box4", type: "box", x: 90, y: 160, width: 30, height: 30, label: "4", color: "rgba(59, 130, 246, 0.3)" },
        { id: "f-box6", type: "box", x: 125, y: 160, width: 30, height: 30, label: "6", color: "rgba(59, 130, 246, 0.3)" },
        { id: "map-fn", type: "function", x: 200, y: 155, width: 100, height: 40, label: ".Select(x²)", color: "rgba(34, 197, 94, 0.2)" },
        { id: "result-label", type: "text", x: 80, y: 240, width: 0, height: 0, label: "Result: [4, 16, 36]", color: "" },
        { id: "r-box1", type: "box", x: 55, y: 260, width: 30, height: 30, label: "4", color: "rgba(168, 85, 247, 0.3)" },
        { id: "r-box2", type: "box", x: 90, y: 260, width: 30, height: 30, label: "16", color: "rgba(168, 85, 247, 0.3)" },
        { id: "r-box3", type: "box", x: 125, y: 260, width: 30, height: 30, label: "36", color: "rgba(168, 85, 247, 0.3)" },
      ],
    },
    steps: [
      { type: "highlight", target: "input-label", duration: 800 },
      { type: "highlight", target: "box2", duration: 400 },
      { type: "highlight", target: "box4", duration: 400 },
      { type: "highlight", target: "box6", duration: 400 },
      { type: "highlight", target: "filter-fn", duration: 1000 },
      { type: "highlight", target: "filtered-label", duration: 600 },
      { type: "highlight", target: "f-box2", duration: 300 },
      { type: "highlight", target: "f-box4", duration: 300 },
      { type: "highlight", target: "f-box6", duration: 300 },
      { type: "highlight", target: "map-fn", duration: 1000 },
      { type: "highlight", target: "result-label", duration: 600 },
      { type: "highlight", target: "r-box1", duration: 300 },
      { type: "highlight", target: "r-box2", duration: 300 },
      { type: "highlight", target: "r-box3", duration: 300 },
    ],
  },
  {
    lessonId: "function-composition",
    sceneData: {
      shapes: [
        { id: "title", type: "text", x: 200, y: 30, width: 0, height: 0, label: "Compose(f, g)(x) = f(g(x))", color: "" },
        { id: "input", type: "box", x: 30, y: 130, width: 50, height: 40, label: "5", color: "rgba(59, 130, 246, 0.3)" },
        { id: "arrow1", type: "arrow", x: 80, y: 150, width: 40, height: 0, label: "", color: "" },
        { id: "g-fn", type: "function", x: 130, y: 115, width: 80, height: 70, label: "g: x*3", color: "rgba(245, 158, 11, 0.2)" },
        { id: "middle", type: "box", x: 220, y: 130, width: 50, height: 40, label: "15", color: "rgba(245, 158, 11, 0.3)" },
        { id: "arrow2", type: "arrow", x: 270, y: 150, width: 40, height: 0, label: "", color: "" },
        { id: "f-fn", type: "function", x: 320, y: 115, width: 80, height: 70, label: "f: x+1", color: "rgba(34, 197, 94, 0.2)" },
        { id: "output", type: "box", x: 410, y: 130, width: 50, height: 40, label: "16", color: "rgba(168, 85, 247, 0.3)" },
        { id: "step1", type: "text", x: 170, y: 210, width: 0, height: 0, label: "Step 1: g(5) = 5 * 3 = 15", color: "" },
        { id: "step2", type: "text", x: 350, y: 210, width: 0, height: 0, label: "Step 2: f(15) = 15 + 1 = 16", color: "" },
      ],
    },
    steps: [
      { type: "highlight", target: "title", duration: 1000 },
      { type: "highlight", target: "input", duration: 600 },
      { type: "highlight", target: "arrow1", duration: 400 },
      { type: "highlight", target: "g-fn", duration: 800 },
      { type: "highlight", target: "step1", duration: 800 },
      { type: "highlight", target: "middle", duration: 600 },
      { type: "highlight", target: "arrow2", duration: 400 },
      { type: "highlight", target: "f-fn", duration: 800 },
      { type: "highlight", target: "step2", duration: 800 },
      { type: "highlight", target: "output", duration: 600 },
    ],
  },
  {
    lessonId: "option-type",
    sceneData: {
      shapes: [
        { id: "title", type: "text", x: 200, y: 30, width: 0, height: 0, label: "Option<T>: Safe null handling", color: "" },
        { id: "some-box", type: "box", x: 80, y: 80, width: 120, height: 60, label: "Some(value)", color: "rgba(34, 197, 94, 0.2)" },
        { id: "none-box", type: "box", x: 220, y: 80, width: 120, height: 60, label: "None", color: "rgba(239, 68, 68, 0.2)" },
        { id: "divide-fn", type: "function", x: 150, y: 180, width: 120, height: 50, label: "SafeDivide", color: "rgba(59, 130, 246, 0.2)" },
        { id: "case1", type: "text", x: 100, y: 260, width: 0, height: 0, label: "10 / 2 → Some(5)", color: "" },
        { id: "case2", type: "text", x: 280, y: 260, width: 0, height: 0, label: "10 / 0 → None", color: "" },
      ],
    },
    steps: [
      { type: "highlight", target: "title", duration: 1000 },
      { type: "highlight", target: "some-box", duration: 800 },
      { type: "highlight", target: "none-box", duration: 800 },
      { type: "highlight", target: "divide-fn", duration: 1000 },
      { type: "highlight", target: "case1", duration: 800 },
      { type: "highlight", target: "case2", duration: 800 },
    ],
  },
  {
    lessonId: "reduce-fold",
    sceneData: {
      shapes: [
        { id: "title", type: "text", x: 200, y: 30, width: 0, height: 0, label: "Aggregate: Reduce to single value", color: "" },
        { id: "input-label", type: "text", x: 60, y: 60, width: 0, height: 0, label: "Input: [1, 2, 3, 4, 5]", color: "" },
        { id: "acc-0", type: "box", x: 30, y: 100, width: 60, height: 30, label: "acc=1", color: "rgba(156, 163, 175, 0.3)" },
        { id: "step1", type: "text", x: 120, y: 110, width: 0, height: 0, label: "× 1 = 1", color: "" },
        { id: "acc-1", type: "box", x: 30, y: 140, width: 60, height: 30, label: "acc=1", color: "rgba(156, 163, 175, 0.3)" },
        { id: "step2", type: "text", x: 120, y: 150, width: 0, height: 0, label: "× 2 = 2", color: "" },
        { id: "acc-2", type: "box", x: 30, y: 180, width: 60, height: 30, label: "acc=2", color: "rgba(59, 130, 246, 0.3)" },
        { id: "step3", type: "text", x: 120, y: 190, width: 0, height: 0, label: "× 3 = 6", color: "" },
        { id: "acc-3", type: "box", x: 30, y: 220, width: 60, height: 30, label: "acc=6", color: "rgba(59, 130, 246, 0.3)" },
        { id: "step4", type: "text", x: 120, y: 230, width: 0, height: 0, label: "× 4 = 24", color: "" },
        { id: "acc-4", type: "box", x: 30, y: 260, width: 60, height: 30, label: "acc=24", color: "rgba(59, 130, 246, 0.3)" },
        { id: "step5", type: "text", x: 120, y: 270, width: 0, height: 0, label: "× 5 = 120", color: "" },
        { id: "result", type: "box", x: 200, y: 260, width: 80, height: 40, label: "120", color: "rgba(168, 85, 247, 0.3)" },
      ],
    },
    steps: [
      { type: "highlight", target: "title", duration: 800 },
      { type: "highlight", target: "input-label", duration: 600 },
      { type: "highlight", target: "acc-0", duration: 400 },
      { type: "highlight", target: "step1", duration: 400 },
      { type: "highlight", target: "acc-1", duration: 400 },
      { type: "highlight", target: "step2", duration: 400 },
      { type: "highlight", target: "acc-2", duration: 400 },
      { type: "highlight", target: "step3", duration: 400 },
      { type: "highlight", target: "acc-3", duration: 400 },
      { type: "highlight", target: "step4", duration: 400 },
      { type: "highlight", target: "acc-4", duration: 400 },
      { type: "highlight", target: "step5", duration: 400 },
      { type: "highlight", target: "result", duration: 800 },
    ],
  },
];

export async function seedDatabase(): Promise<void> {
  const existingLessons = await db.select().from(lessons);
  if (existingLessons.length > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with lessons and animations...");

  for (const lesson of seedLessons) {
    await db.insert(lessons).values(lesson);
  }

  for (const animation of seedAnimations) {
    await db.insert(lessonAnimations).values(animation);
  }

  console.log("Database seeded successfully!");
}
