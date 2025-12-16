import type { Lesson } from "@shared/schema";

export const lessons: Lesson[] = [
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

  // ============================================
  // MODULE 2: DELEGATE FOUNDATIONS
  // ============================================

  {
    id: "delegate-types",
    title: "Delegates as Function Values",
    conceptTags: ["delegates", "function values", "method groups", "signatures"],
    order: 6,
    description: `## Delegates: The "Function Value" Mental Model

Delegates let you treat **behavior as data**. Instead of hard-coding *what* happens, you pass *how* it happens.

### What is a Delegate?

A **delegate type** describes a callable signature: parameter list + return type.

A **delegate instance** is an object you can store, pass around, and invoke.

\`\`\`csharp
// Declare a delegate TYPE
delegate int MathOperation(int a, int b);

// Create delegate INSTANCES
MathOperation add = (a, b) => a + b;
MathOperation multiply = (a, b) => a * b;

// Invoke them
Console.WriteLine(add(3, 4));      // 7
Console.WriteLine(multiply(3, 4)); // 12
\`\`\`

### Method Groups

You can assign an existing method directly to a delegate:

\`\`\`csharp
Action<string> log = Console.WriteLine;
log("Hello!"); // Calls Console.WriteLine
\`\`\`

### Important: Return Type Matters!

For method overloads, return type is NOT part of the signature.
**For delegates, return type IS part of the signature.**

\`Func<int, int>\` and \`Action<int>\` are completely different types!

### Anti-Pattern: Using \`object\` or \`dynamic\` Instead of Delegates

\`\`\`csharp
// ❌ ANTI-PATTERN: Losing type safety
object transform = new Func<string, string>(s => s.ToUpper());
var result = ((Func<string, string>)transform)("hello"); // Ugly cast!

// ❌ ANTI-PATTERN: Using dynamic
dynamic transform = (string s) => s.ToUpper();
var result = transform("hello"); // No compile-time checking!

// ✅ CORRECT: Use typed delegates
Func<string, string> transform = s => s.ToUpper();
var result = transform("hello"); // Type-safe!
\`\`\`

**Why it's bad:** You lose compile-time type checking, IntelliSense, and refactoring support.

### Your Task

Create a delegate type \`StringTransform\` that takes a string and returns a string.
Implement \`ApplyTransform\` that applies any transform to a string.`,
    skeleton: `using System;

// Define a delegate type for string transformations
public delegate string StringTransform(string input);

public class Exercise
{
    // Apply the given transform to the input string
    public static string ApplyTransform(string input, StringTransform transform)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        StringTransform toUpper = s => s.ToUpper();
        StringTransform addExclaim = s => s + "!";

        Console.WriteLine(ApplyTransform("hello", toUpper));
        Console.WriteLine(ApplyTransform("wow", addExclaim));
    }
}`,
    referenceSolution: `using System;

public delegate string StringTransform(string input);

public class Exercise
{
    public static string ApplyTransform(string input, StringTransform transform)
    {
        return transform(input);
    }

    public static void Main()
    {
        StringTransform toUpper = s => s.ToUpper();
        StringTransform addExclaim = s => s + "!";

        Console.WriteLine(ApplyTransform("hello", toUpper));
        Console.WriteLine(ApplyTransform("wow", addExclaim));
    }
}`,
    testCode: `[
  { "name": "ToUpper transform works", "input": "hello", "transform": "toUpper", "expected": "HELLO" },
  { "name": "AddExclaim transform works", "input": "wow", "transform": "addExclaim", "expected": "wow!" },
  { "name": "Reverse transform works", "input": "abc", "transform": "reverse", "expected": "cba" },
  { "name": "Empty string handled", "input": "", "transform": "toUpper", "expected": "" },
  { "name": "Identity transform works", "input": "test", "transform": "identity", "expected": "test" }
]`,
    hints: {
      "ToUpper transform works": "Simply invoke the transform delegate with the input: transform(input)",
      "Reverse transform works": "The delegate handles the logic - you just need to call it",
      "Empty string handled": "Delegates work the same way regardless of input value",
    },
  },
  {
    id: "action-func-predicate",
    title: "Action, Func & Predicate",
    conceptTags: ["Action", "Func", "Predicate", "built-in delegates"],
    order: 7,
    description: `## Built-in Delegate Types

C# provides generic delegate types so you don't need to define your own.

### Choosing the Right One

| Delegate | Returns | Use When |
|----------|---------|----------|
| \`Action<...>\` | void | Side effects only (logging, saving) |
| \`Func<..., TResult>\` | TResult | Computing/returning a value |
| \`Predicate<T>\` | bool | Testing a condition |

### Action (no return value)

\`\`\`csharp
Action<string> log = msg => Console.WriteLine(msg);
Action<int, int> printSum = (a, b) => Console.WriteLine(a + b);

log("Hello");        // prints "Hello"
printSum(3, 4);      // prints "7"
\`\`\`

### Func (returns a value)

\`\`\`csharp
Func<int, int> square = x => x * x;
Func<int, int, int> add = (a, b) => a + b;
Func<string> getGreeting = () => "Hello!";

Console.WriteLine(square(5));      // 25
Console.WriteLine(add(3, 4));      // 7
Console.WriteLine(getGreeting()); // "Hello!"
\`\`\`

### Predicate (returns bool)

\`\`\`csharp
Predicate<int> isEven = n => n % 2 == 0;
Predicate<string> isEmpty = s => string.IsNullOrEmpty(s);

Console.WriteLine(isEven(4));     // True
Console.WriteLine(isEmpty(""));   // True
\`\`\`

### Anti-Pattern: Misusing Action vs Func

\`\`\`csharp
// ❌ ANTI-PATTERN: Using Action when you need a return value
Action<int> process = n => { var result = n * 2; }; // Result is lost!

// ❌ ANTI-PATTERN: Using Func and ignoring the return value
Func<int, int> compute = n => n * 2;
compute(5); // Warning: return value discarded!

// ❌ ANTI-PATTERN: Creating custom delegates when built-ins work
delegate bool MyPredicate(int x); // Unnecessary! Use Predicate<int>

// ✅ CORRECT: Match delegate type to intent
Action<int> log = n => Console.WriteLine(n);     // No return needed
Func<int, int> transform = n => n * 2;           // Returns value
Predicate<int> check = n => n > 0;               // Returns bool
\`\`\`

**Why it's bad:** Using wrong delegate types obscures intent and can cause bugs.

### Your Task

Implement \`CountMatching\` that counts how many items in a list match a predicate.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Count items that match the predicate
    public static int CountMatching<T>(List<T> items, Predicate<T> predicate)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        Predicate<int> isEven = n => n % 2 == 0;
        Predicate<int> isGreaterThan5 = n => n > 5;

        Console.WriteLine($"Even count: {CountMatching(numbers, isEven)}");
        Console.WriteLine($"Greater than 5: {CountMatching(numbers, isGreaterThan5)}");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    public static int CountMatching<T>(List<T> items, Predicate<T> predicate)
    {
        int count = 0;
        foreach (var item in items)
        {
            if (predicate(item))
                count++;
        }
        return count;
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        Predicate<int> isEven = n => n % 2 == 0;
        Predicate<int> isGreaterThan5 = n => n > 5;

        Console.WriteLine($"Even count: {CountMatching(numbers, isEven)}");
        Console.WriteLine($"Greater than 5: {CountMatching(numbers, isGreaterThan5)}");
    }
}`,
    testCode: `[
  { "name": "Count even numbers in 1-10", "input": [1,2,3,4,5,6,7,8,9,10], "predicate": "isEven", "expected": 5 },
  { "name": "Count numbers > 5", "input": [1,2,3,4,5,6,7,8,9,10], "predicate": "greaterThan5", "expected": 5 },
  { "name": "Count in empty list", "input": [], "predicate": "isEven", "expected": 0 },
  { "name": "Count all matching", "input": [2,4,6], "predicate": "isEven", "expected": 3 },
  { "name": "Count none matching", "input": [1,3,5], "predicate": "isEven", "expected": 0 }
]`,
    hints: {
      "Count even numbers in 1-10": "Loop through items and increment a counter when predicate(item) returns true",
      "Count in empty list": "An empty list should return 0 - the loop simply doesn't execute",
      "Count none matching": "When no items match, the counter stays at 0",
    },
  },
  {
    id: "lambdas-closures",
    title: "Lambdas & Closures",
    conceptTags: ["lambdas", "closures", "captures", "static lambdas"],
    order: 8,
    description: `## Lambda Expressions

Lambdas are a concise way to create anonymous functions.

### Two Forms

**Expression lambda** (single expression):
\`\`\`csharp
Func<int, int> square = x => x * x;
\`\`\`

**Statement lambda** (multiple statements):
\`\`\`csharp
Func<int, int> factorial = n => {
    int result = 1;
    for (int i = 2; i <= n; i++)
        result *= i;
    return result;
};
\`\`\`

### Closures: Capturing Outer Variables

When a lambda uses variables from outside its scope, it **captures** them:

\`\`\`csharp
int multiplier = 3;
Func<int, int> multiply = x => x * multiplier; // captures 'multiplier'

Console.WriteLine(multiply(5)); // 15
multiplier = 10;
Console.WriteLine(multiply(5)); // 50 - uses current value!
\`\`\`

### The Closure Trap

\`\`\`csharp
var actions = new List<Action>();
for (int i = 0; i < 3; i++)
{
    actions.Add(() => Console.WriteLine(i)); // Bug! All print 3
}
// Fix: capture a copy
for (int i = 0; i < 3; i++)
{
    int copy = i;
    actions.Add(() => Console.WriteLine(copy)); // Correct: 0, 1, 2
}
\`\`\`

### Static Lambdas (C# 9+)

Prevent accidental capture with \`static\`:

\`\`\`csharp
int x = 5;
Func<int, int> bad = y => y + x;           // captures x
Func<int, int> good = static y => y * 2;   // compile error if it captures
\`\`\`

### Anti-Pattern: The Loop Closure Bug

\`\`\`csharp
// ❌ ANTI-PATTERN: Capturing loop variable directly
var funcs = new List<Func<int>>();
for (int i = 0; i < 3; i++)
{
    funcs.Add(() => i);  // All capture same 'i'!
}
// funcs[0](), funcs[1](), funcs[2]() all return 3!

// ❌ ANTI-PATTERN: Capturing expensive objects unnecessarily
var bigData = LoadHugeDataset();
Func<int, bool> filter = n => n > 0;  // Accidentally keeps bigData alive!

// ✅ CORRECT: Copy loop variable
for (int i = 0; i < 3; i++)
{
    int copy = i;
    funcs.Add(() => copy);  // Each captures its own copy
}

// ✅ CORRECT: Use static lambda if no capture needed
Func<int, bool> filter = static n => n > 0;  // No captures
\`\`\`

**Why it's bad:** Loop closure bugs are subtle and cause all lambdas to see the final value. Unnecessary captures cause memory leaks.

### Your Task

Implement \`CreateMultiplier\` that returns a function which multiplies by a captured value.`,
    skeleton: `using System;

public class Exercise
{
    // Return a function that multiplies its input by 'factor'
    public static Func<int, int> CreateMultiplier(int factor)
    {
        // Your code here - use a closure to capture 'factor'
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var double_it = CreateMultiplier(2);
        var triple = CreateMultiplier(3);

        Console.WriteLine($"double(5) = {double_it(5)}");
        Console.WriteLine($"triple(5) = {triple(5)}");
        Console.WriteLine($"double(10) = {double_it(10)}");
    }
}`,
    referenceSolution: `using System;

public class Exercise
{
    public static Func<int, int> CreateMultiplier(int factor)
    {
        return x => x * factor;
    }

    public static void Main()
    {
        var double_it = CreateMultiplier(2);
        var triple = CreateMultiplier(3);

        Console.WriteLine($"double(5) = {double_it(5)}");
        Console.WriteLine($"triple(5) = {triple(5)}");
        Console.WriteLine($"double(10) = {double_it(10)}");
    }
}`,
    testCode: `[
  { "name": "CreateMultiplier(2)(5) = 10", "factor": 2, "input": 5, "expected": 10 },
  { "name": "CreateMultiplier(3)(5) = 15", "factor": 3, "input": 5, "expected": 15 },
  { "name": "CreateMultiplier(0)(100) = 0", "factor": 0, "input": 100, "expected": 0 },
  { "name": "CreateMultiplier(1)(42) = 42", "factor": 1, "input": 42, "expected": 42 },
  { "name": "CreateMultiplier(-2)(5) = -10", "factor": -2, "input": 5, "expected": -10 }
]`,
    hints: {
      "CreateMultiplier(2)(5) = 10": "Return a lambda that captures 'factor': x => x * factor",
      "CreateMultiplier(0)(100) = 0": "The closure captures factor=0, so any input * 0 = 0",
      "CreateMultiplier(-2)(5) = -10": "Closures work with any value, including negatives",
    },
  },

  // ============================================
  // MODULE 3: HTO PATTERNS
  // ============================================

  {
    id: "hto-callback",
    title: "HTO-1: Callback Pattern",
    conceptTags: ["callback", "HTO", "Action", "notify"],
    order: 9,
    description: `## HTO Pattern: Callback

> **HTO (Higher-Order Technique)**: A design where code **accepts behavior** as a value and/or **returns behavior**.

### The Callback Pattern

**Intent:** Decouple a producer from "what to do next."

**Signature:** Usually \`Action<T>\` (no return) or \`Func<T, TResult>\` (with return).

**Where you see it:** Timers, background work, library hooks, progress reporting.

### Example: Progress Reporter

\`\`\`csharp
void ProcessItems(List<string> items, Action<int> onProgress)
{
    for (int i = 0; i < items.Count; i++)
    {
        // Do work...
        onProgress(i + 1); // Notify progress
    }
}

// Usage
ProcessItems(myItems, count => Console.WriteLine($"Processed {count} items"));
\`\`\`

### Why Callbacks?

- **Decoupling:** The processor doesn't know how progress is displayed
- **Testability:** Pass a mock callback that records calls
- **Flexibility:** Different callers can handle notifications differently

### Anti-Pattern: Async Void and Unhandled Exceptions

\`\`\`csharp
// ❌ ANTI-PATTERN: async void callback - exceptions crash the app!
void Process(Action onComplete)
{
    // Work...
    onComplete();
}
Process(async () => {
    await Task.Delay(100);
    throw new Exception("Oops!"); // Unobserved, crashes process!
});

// ❌ ANTI-PATTERN: Ignoring callback exceptions
void NotifyAll(List<Action> callbacks)
{
    foreach (var cb in callbacks)
        cb();  // If one throws, rest are skipped!
}

// ✅ CORRECT: Use Func<Task> for async callbacks
void Process(Func<Task> onComplete)
{
    // Work...
    await onComplete();  // Exception properly propagated
}

// ✅ CORRECT: Handle callback exceptions
void NotifyAll(List<Action> callbacks)
{
    foreach (var cb in callbacks)
    {
        try { cb(); }
        catch (Exception ex) { Log(ex); }
    }
}
\`\`\`

**Why it's bad:** \`async void\` exceptions are unobserved and can crash your process. Unhandled callback exceptions break notification chains.

### Your Task

Implement \`ProcessWithProgress\` that processes numbers and reports progress via callback.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Process each number (square it) and call onProgress after each
    // onProgress receives: (index, originalValue, processedValue)
    public static List<int> ProcessWithProgress(
        List<int> numbers,
        Action<int, int, int> onProgress)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var numbers = new List<int> { 2, 3, 4 };
        var results = ProcessWithProgress(numbers, (idx, orig, result) =>
            Console.WriteLine($"[{idx}] {orig} -> {result}"));

        Console.WriteLine($"Results: [{string.Join(", ", results)}]");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    public static List<int> ProcessWithProgress(
        List<int> numbers,
        Action<int, int, int> onProgress)
    {
        var results = new List<int>();
        for (int i = 0; i < numbers.Count; i++)
        {
            int squared = numbers[i] * numbers[i];
            results.Add(squared);
            onProgress(i, numbers[i], squared);
        }
        return results;
    }

    public static void Main()
    {
        var numbers = new List<int> { 2, 3, 4 };
        var results = ProcessWithProgress(numbers, (idx, orig, result) =>
            Console.WriteLine($"[{idx}] {orig} -> {result}"));

        Console.WriteLine($"Results: [{string.Join(", ", results)}]");
    }
}`,
    testCode: `[
  { "name": "Returns squared values", "input": [2,3,4], "expected": [4,9,16] },
  { "name": "Callback called for each item", "input": [1,2,3], "expectedCallCount": 3 },
  { "name": "Empty list returns empty", "input": [], "expected": [] },
  { "name": "Single item works", "input": [5], "expected": [25] },
  { "name": "Callback receives correct indices", "input": [10,20], "expectedIndices": [0,1] }
]`,
    hints: {
      "Returns squared values": "Loop through numbers, square each one, add to results list",
      "Callback called for each item": "Call onProgress(i, numbers[i], squared) inside the loop",
      "Empty list returns empty": "The loop doesn't execute for empty input, returning empty results",
    },
  },
  {
    id: "hto-strategy",
    title: "HTO-2: Strategy Pattern",
    conceptTags: ["strategy", "HTO", "policy", "runtime behavior"],
    order: 10,
    description: `## HTO Pattern: Strategy

**Intent:** Inject a policy/algorithm without subclassing.

**Signature:** \`Func<TIn, TOut>\` or \`Func<TIn, bool>\` for decisions.

### The Strategy Pattern with Delegates

Instead of creating interface + multiple classes, pass a function:

\`\`\`csharp
// Traditional OOP: IDiscountStrategy, PercentDiscount, FixedDiscount...
// Functional: just pass a Func!

decimal CalculateTotal(decimal subtotal, Func<decimal, decimal> discountStrategy)
{
    var discount = discountStrategy(subtotal);
    return subtotal - discount;
}

// Usage
Func<decimal, decimal> tenPercent = amount => amount * 0.10m;
Func<decimal, decimal> fixedFive = amount => 5m;

var total1 = CalculateTotal(100m, tenPercent); // 90
var total2 = CalculateTotal(100m, fixedFive);  // 95
\`\`\`

### Real-World Uses

- **Validation strategies:** \`Func<T, bool>\` to decide if valid
- **Logging filters:** \`Func<LogEntry, bool>\` to decide what to log
- **Pricing rules:** \`Func<Order, decimal>\` to calculate prices

### When to Use Strategy

- Behavior varies at runtime
- Multiple algorithms for the same task
- You want to avoid a class hierarchy

### Anti-Pattern: Hardcoding Strategies

\`\`\`csharp
// ❌ ANTI-PATTERN: Hardcoded switch/if-else for strategies
decimal GetDiscount(string type, decimal amount)
{
    return type switch
    {
        "percent10" => amount * 0.10m,
        "fixed5" => 5m,
        "none" => 0m,
        _ => 0m  // Must modify code to add new strategies!
    };
}

// ❌ ANTI-PATTERN: Null strategy without default
decimal Calculate(decimal amount, Func<decimal, decimal>? strategy)
{
    return amount - strategy(amount);  // NullReferenceException!
}

// ✅ CORRECT: Accept strategy as parameter
decimal GetDiscount(decimal amount, Func<decimal, decimal> strategy)
    => strategy(amount);

// ✅ CORRECT: Provide sensible default
decimal Calculate(decimal amount, Func<decimal, decimal>? strategy = null)
{
    var actualStrategy = strategy ?? (x => 0m);  // Default: no discount
    return amount - actualStrategy(amount);
}
\`\`\`

**Why it's bad:** Hardcoded strategies violate Open/Closed Principle. Adding new strategies requires code changes and recompilation.

### Your Task

Implement \`FilterBy\` that filters a list using a strategy function.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Filter items using the provided strategy
    public static List<T> FilterBy<T>(List<T> items, Func<T, bool> strategy)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        // Different strategies
        Func<int, bool> evensOnly = n => n % 2 == 0;
        Func<int, bool> greaterThan5 = n => n > 5;
        Func<int, bool> isPrime = n => n > 1 && !Enumerable.Range(2, (int)Math.Sqrt(n)).Any(i => n % i == 0);

        Console.WriteLine($"Evens: [{string.Join(", ", FilterBy(numbers, evensOnly))}]");
        Console.WriteLine($">5: [{string.Join(", ", FilterBy(numbers, greaterThan5))}]");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    public static List<T> FilterBy<T>(List<T> items, Func<T, bool> strategy)
    {
        var result = new List<T>();
        foreach (var item in items)
        {
            if (strategy(item))
                result.Add(item);
        }
        return result;
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

        Func<int, bool> evensOnly = n => n % 2 == 0;
        Func<int, bool> greaterThan5 = n => n > 5;

        Console.WriteLine($"Evens: [{string.Join(", ", FilterBy(numbers, evensOnly))}]");
        Console.WriteLine($">5: [{string.Join(", ", FilterBy(numbers, greaterThan5))}]");
    }
}`,
    testCode: `[
  { "name": "Filter evens from 1-10", "input": [1,2,3,4,5,6,7,8,9,10], "strategy": "isEven", "expected": [2,4,6,8,10] },
  { "name": "Filter > 5 from 1-10", "input": [1,2,3,4,5,6,7,8,9,10], "strategy": "greaterThan5", "expected": [6,7,8,9,10] },
  { "name": "Filter none matching", "input": [1,3,5], "strategy": "isEven", "expected": [] },
  { "name": "Filter all matching", "input": [2,4,6], "strategy": "isEven", "expected": [2,4,6] },
  { "name": "Filter empty list", "input": [], "strategy": "isEven", "expected": [] }
]`,
    hints: {
      "Filter evens from 1-10": "Loop through items, add to result if strategy(item) returns true",
      "Filter none matching": "When no items match the strategy, return an empty list",
      "Filter all matching": "When all items match, return all of them",
    },
  },
  {
    id: "hto-pipeline",
    title: "HTO-3: Pipeline Pattern",
    conceptTags: ["pipeline", "middleware", "HTO", "composition", "chain"],
    order: 11,
    description: `## HTO Pattern: Pipeline / Middleware

**Intent:** Build a chain where each step can do work before/after "next."

**Signature:** \`Func<TContext, Func<Task>, Task>\` or similar.

### The Pipeline Concept

Each middleware component:
1. Does work **before** calling next
2. Calls **next** to continue the chain
3. Does work **after** next returns
4. Can **short-circuit** by not calling next

\`\`\`csharp
// Conceptual middleware
async Task LoggingMiddleware(Context ctx, Func<Task> next)
{
    Console.WriteLine("Before");
    await next();  // Continue pipeline
    Console.WriteLine("After");
}
\`\`\`

### ASP.NET Core Connection

This is exactly how ASP.NET Core middleware works:
- \`RequestDelegate\` is \`HttpContext -> Task\`
- Each middleware wraps the next one

### Building a Simple Pipeline

\`\`\`csharp
public class Pipeline
{
    private readonly List<Func<Action, Action>> _middlewares = new();

    public void Use(Func<Action, Action> middleware)
        => _middlewares.Add(middleware);

    public Action Build()
    {
        Action app = () => { }; // Terminal
        for (int i = _middlewares.Count - 1; i >= 0; i--)
            app = _middlewares[i](app);
        return app;
    }
}
\`\`\`

### Anti-Pattern: Forgetting to Call Next

\`\`\`csharp
// ❌ ANTI-PATTERN: Forgetting to call next breaks the chain
app.Use(async (ctx, next) =>
{
    Console.WriteLine("Starting");
    // Forgot await next()! Pipeline stops here!
});

// ❌ ANTI-PATTERN: Calling next multiple times
app.Use(async (ctx, next) =>
{
    await next();  // First call
    await next();  // Second call - runs pipeline again!
});

// ❌ ANTI-PATTERN: Modifying response after next (for headers)
app.Use(async (ctx, next) =>
{
    await next();
    ctx.Response.Headers.Add("X-Custom", "value");  // Too late! Response started!
});

// ✅ CORRECT: Always call next exactly once
app.Use(async (ctx, next) =>
{
    Console.WriteLine("Before");
    await next();  // Continue pipeline
    Console.WriteLine("After");
});
\`\`\`

**Why it's bad:** Not calling \`next\` breaks the pipeline. Calling it multiple times causes duplicate processing. Modifying response after \`next\` may fail.

### Your Task

Implement a pipeline that wraps string processing with "before/after" steps.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Build a pipeline: each step wraps the next
    // Steps are applied in order: first added = outermost wrapper
    public static Func<string, string> BuildPipeline(
        List<Func<string, Func<string, string>, string>> steps)
    {
        // Your code here
        // Hint: start from the innermost (identity) and wrap outward
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var steps = new List<Func<string, Func<string, string>, string>>
        {
            (input, next) => "[" + next(input) + "]",  // Wrap in brackets
            (input, next) => next(input.ToUpper()),    // Uppercase first
        };

        var pipeline = BuildPipeline(steps);
        Console.WriteLine(pipeline("hello")); // Expected: [HELLO]
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    public static Func<string, string> BuildPipeline(
        List<Func<string, Func<string, string>, string>> steps)
    {
        // Start with identity function (terminal)
        Func<string, string> pipeline = s => s;

        // Wrap from last to first (so first step is outermost)
        for (int i = steps.Count - 1; i >= 0; i--)
        {
            var step = steps[i];
            var next = pipeline;
            pipeline = input => step(input, next);
        }

        return pipeline;
    }

    public static void Main()
    {
        var steps = new List<Func<string, Func<string, string>, string>>
        {
            (input, next) => "[" + next(input) + "]",
            (input, next) => next(input.ToUpper()),
        };

        var pipeline = BuildPipeline(steps);
        Console.WriteLine(pipeline("hello"));
    }
}`,
    testCode: `[
  { "name": "Brackets + uppercase", "input": "hello", "steps": ["brackets", "uppercase"], "expected": "[HELLO]" },
  { "name": "Empty pipeline returns input", "input": "test", "steps": [], "expected": "test" },
  { "name": "Single step works", "input": "hi", "steps": ["uppercase"], "expected": "HI" },
  { "name": "Order matters", "input": "abc", "steps": ["addX", "uppercase"], "expected": "ABCX" },
  { "name": "Three steps", "input": "a", "steps": ["brackets", "uppercase", "addExclaim"], "expected": "[A!]" }
]`,
    hints: {
      "Brackets + uppercase": "Build from inside out: identity -> uppercase -> brackets. First step added wraps the result of later steps.",
      "Empty pipeline returns input": "With no steps, just return the identity function: s => s",
      "Order matters": "The first step in the list sees the original input and wraps all subsequent transformations",
    },
  },
  {
    id: "hto-linq-transform",
    title: "HTO-6: LINQ as Higher-Order",
    conceptTags: ["LINQ", "HTO", "transform", "Func", "Predicate"],
    order: 12,
    description: `## HTO Pattern: LINQ Transform

**Intent:** Treat algorithms as data transforms using functions.

**Signature:** \`Func<T, bool>\` for filters, \`Func<T, TResult>\` for projections.

### LINQ is Pure HTO

Every LINQ method accepts a delegate:

\`\`\`csharp
// Where accepts Func<T, bool>
var evens = numbers.Where(n => n % 2 == 0);

// Select accepts Func<T, TResult>
var squares = numbers.Select(n => n * n);

// OrderBy accepts Func<T, TKey>
var sorted = people.OrderBy(p => p.Age);
\`\`\`

### Composing Transforms

\`\`\`csharp
var result = numbers
    .Where(n => n > 0)           // Filter
    .Select(n => n * 2)          // Transform
    .Where(n => n < 100)         // Filter again
    .OrderByDescending(n => n)   // Sort
    .Take(5);                    // Limit
\`\`\`

### Custom LINQ-Style Methods

You can create your own:

\`\`\`csharp
public static IEnumerable<T> WhereNot<T>(
    this IEnumerable<T> source,
    Func<T, bool> predicate)
{
    return source.Where(item => !predicate(item));
}

// Usage
var odds = numbers.WhereNot(n => n % 2 == 0);
\`\`\`

### Anti-Pattern: Multiple Enumeration and Side Effects

\`\`\`csharp
// ❌ ANTI-PATTERN: Multiple enumeration of IEnumerable
IEnumerable<int> query = GetExpensiveData().Where(x => x > 0);
Console.WriteLine(query.Count());  // Enumerates once
Console.WriteLine(query.First());  // Enumerates AGAIN!

// ❌ ANTI-PATTERN: Side effects in LINQ predicates
var count = 0;
var result = numbers.Where(n => { count++; return n > 0; }); // Side effect!

// ❌ ANTI-PATTERN: Modifying collection during iteration
foreach (var item in list.Where(x => x.IsOld))
    list.Remove(item);  // Collection modified exception!

// ✅ CORRECT: Materialize once if needed multiple times
var data = GetExpensiveData().Where(x => x > 0).ToList();
Console.WriteLine(data.Count);
Console.WriteLine(data.First());

// ✅ CORRECT: Keep predicates pure
var result = numbers.Where(n => n > 0);  // Pure, no side effects
\`\`\`

**Why it's bad:** Multiple enumeration is wasteful and can cause bugs with non-repeatable sources. Side effects make code unpredictable.

### Your Task

Implement \`Transform\` that applies a series of transformations to each item.`,
    skeleton: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    // Apply all transformations in sequence to each item
    public static List<T> Transform<T>(
        List<T> items,
        params Func<T, T>[] transformations)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3 };

        Func<int, int> addOne = x => x + 1;
        Func<int, int> double_it = x => x * 2;
        Func<int, int> square = x => x * x;

        // Apply: addOne, then double
        var result = Transform(numbers, addOne, double_it);
        // 1 -> 2 -> 4, 2 -> 3 -> 6, 3 -> 4 -> 8
        Console.WriteLine($"[{string.Join(", ", result)}]");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Linq;

public class Exercise
{
    public static List<T> Transform<T>(
        List<T> items,
        params Func<T, T>[] transformations)
    {
        return items.Select(item =>
        {
            var result = item;
            foreach (var transform in transformations)
            {
                result = transform(result);
            }
            return result;
        }).ToList();
    }

    public static void Main()
    {
        var numbers = new List<int> { 1, 2, 3 };

        Func<int, int> addOne = x => x + 1;
        Func<int, int> double_it = x => x * 2;
        Func<int, int> square = x => x * x;

        var result = Transform(numbers, addOne, double_it);
        Console.WriteLine($"[{string.Join(", ", result)}]");
    }
}`,
    testCode: `[
  { "name": "AddOne then double", "input": [1,2,3], "transforms": ["addOne", "double"], "expected": [4,6,8] },
  { "name": "No transforms returns original", "input": [5,10], "transforms": [], "expected": [5,10] },
  { "name": "Single transform", "input": [2,3], "transforms": ["square"], "expected": [4,9] },
  { "name": "Three transforms", "input": [1], "transforms": ["addOne", "double", "square"], "expected": [16] },
  { "name": "Empty list", "input": [], "transforms": ["addOne"], "expected": [] }
]`,
    hints: {
      "AddOne then double": "For each item, apply transforms in order: item -> addOne -> double",
      "No transforms returns original": "With no transformations, just return the items as-is",
      "Three transforms": "1 -> addOne -> 2 -> double -> 4 -> square -> 16",
    },
  },
  {
    id: "hto-di-factory",
    title: "HTO-5: DI Factory Pattern",
    conceptTags: ["DI", "factory", "HTO", "IServiceProvider", "Func"],
    order: 13,
    description: `## HTO Pattern: DI Factory

**Intent:** Create a service using runtime context.

**Signature:** \`Func<IServiceProvider, TService>\`

### The Factory Pattern in DI

ASP.NET Core DI supports factory delegates:

\`\`\`csharp
services.AddSingleton<IMyService>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var logger = sp.GetRequiredService<ILogger<MyService>>();
    return new MyService(config["ApiKey"], logger);
});
\`\`\`

### Why Use Factories?

- **Conditional construction:** Choose implementation at runtime
- **Complex initialization:** When constructor isn't enough
- **Accessing other services:** Resolve dependencies manually

### Factory vs Direct Registration

\`\`\`csharp
// Direct - DI handles everything
services.AddSingleton<MyService>();

// Factory - you control construction
services.AddSingleton<IService>(sp => {
    var env = sp.GetRequiredService<IHostEnvironment>();
    return env.IsDevelopment()
        ? new DevService()
        : new ProdService();
});
\`\`\`

### Anti-Pattern: Captive Dependency Problem

\`\`\`csharp
// ❌ ANTI-PATTERN: Singleton capturing scoped service
services.AddSingleton<MySingleton>(sp =>
{
    // DbContext is Scoped, but now captured in a Singleton!
    var db = sp.GetRequiredService<DbContext>();
    return new MySingleton(db);  // db will be disposed, crashes later!
});

// ❌ ANTI-PATTERN: Service locator anti-pattern
services.AddSingleton<MyService>(sp =>
{
    return new MyService(sp);  // Stores IServiceProvider, resolves later
});

// ❌ ANTI-PATTERN: Heavy initialization in factory
services.AddSingleton<ICache>(sp =>
{
    var cache = new Cache();
    cache.WarmUp();  // Blocks startup for minutes!
    return cache;
});

// ✅ CORRECT: Match lifetimes (Scoped uses Scoped)
services.AddScoped<MyService>(sp =>
{
    var db = sp.GetRequiredService<DbContext>();  // Both scoped
    return new MyService(db);
});

// ✅ CORRECT: Inject IServiceScopeFactory for deferred resolution
services.AddSingleton<MyService>(sp =>
{
    var scopeFactory = sp.GetRequiredService<IServiceScopeFactory>();
    return new MyService(scopeFactory);  // Create scope when needed
});
\`\`\`

**Why it's bad:** Captive dependencies cause disposed object exceptions. Service locator hides dependencies and makes testing hard.

### Your Task

Implement \`CreateServiceFactory\` that returns a factory function.`,
    skeleton: `using System;
using System.Collections.Generic;

// Simulated service provider
public interface IServiceProvider
{
    T GetService<T>() where T : class;
}

public class SimpleServiceProvider : IServiceProvider
{
    private readonly Dictionary<Type, object> _services = new();

    public void Register<T>(T service) where T : class
        => _services[typeof(T)] = service;

    public T GetService<T>() where T : class
        => _services.TryGetValue(typeof(T), out var svc) ? (T)svc : null;
}

public class Config { public string ApiKey { get; set; } }
public class Logger { public void Log(string msg) => Console.WriteLine(msg); }
public class ApiClient
{
    public string Key { get; }
    public Logger Logger { get; }
    public ApiClient(string key, Logger logger) { Key = key; Logger = logger; }
}

public class Exercise
{
    // Create a factory that builds ApiClient using services from the provider
    public static Func<IServiceProvider, ApiClient> CreateApiClientFactory()
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var sp = new SimpleServiceProvider();
        sp.Register(new Config { ApiKey = "secret-123" });
        sp.Register(new Logger());

        var factory = CreateApiClientFactory();
        var client = factory(sp);

        Console.WriteLine($"ApiClient created with key: {client.Key}");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public interface IServiceProvider
{
    T GetService<T>() where T : class;
}

public class SimpleServiceProvider : IServiceProvider
{
    private readonly Dictionary<Type, object> _services = new();

    public void Register<T>(T service) where T : class
        => _services[typeof(T)] = service;

    public T GetService<T>() where T : class
        => _services.TryGetValue(typeof(T), out var svc) ? (T)svc : null;
}

public class Config { public string ApiKey { get; set; } }
public class Logger { public void Log(string msg) => Console.WriteLine(msg); }
public class ApiClient
{
    public string Key { get; }
    public Logger Logger { get; }
    public ApiClient(string key, Logger logger) { Key = key; Logger = logger; }
}

public class Exercise
{
    public static Func<IServiceProvider, ApiClient> CreateApiClientFactory()
    {
        return sp =>
        {
            var config = sp.GetService<Config>();
            var logger = sp.GetService<Logger>();
            return new ApiClient(config.ApiKey, logger);
        };
    }

    public static void Main()
    {
        var sp = new SimpleServiceProvider();
        sp.Register(new Config { ApiKey = "secret-123" });
        sp.Register(new Logger());

        var factory = CreateApiClientFactory();
        var client = factory(sp);

        Console.WriteLine($"ApiClient created with key: {client.Key}");
    }
}`,
    testCode: `[
  { "name": "Factory creates client with correct key", "apiKey": "test-key", "expectedKey": "test-key" },
  { "name": "Factory resolves logger", "apiKey": "key", "expectLoggerResolved": true },
  { "name": "Factory is reusable", "callCount": 2, "expectDistinctInstances": true },
  { "name": "Different configs produce different clients", "keys": ["key1", "key2"], "expectedKeys": ["key1", "key2"] }
]`,
    hints: {
      "Factory creates client with correct key": "Return a lambda that takes IServiceProvider and uses GetService to resolve Config and Logger",
      "Factory resolves logger": "Use sp.GetService<Logger>() to get the logger instance",
      "Factory is reusable": "The factory function can be called multiple times with different providers",
    },
  },
  {
    id: "hto-route-handler",
    title: "HTO-4: Minimal API Route Handlers",
    conceptTags: ["Minimal API", "route handler", "Delegate", "RequestDelegate"],
    order: 14,
    description: `## HTO Pattern: Route Handler

**Intent:** Declare endpoints by passing behavior (a delegate).

**Signature:** \`Delegate\` → compiled to \`RequestDelegate\`.

### Minimal API Route Handlers

In ASP.NET Core Minimal APIs, you pass delegates to define endpoints:

\`\`\`csharp
app.MapGet("/hello", () => "Hello World!");

app.MapGet("/users/{id}", (int id) => $"User {id}");

app.MapPost("/users", (User user) => Results.Created($"/users/{user.Id}", user));
\`\`\`

### What Happens Behind the Scenes

1. Your delegate (route handler) is passed to \`MapGet\`/\`MapPost\`
2. \`RequestDelegateFactory.Create()\` compiles it into a \`RequestDelegate\`
3. The framework handles parameter binding, result writing, etc.

### RequestDelegate

The core type: \`Task RequestDelegate(HttpContext context)\`

Your simple \`() => "Hello"\` becomes a full \`RequestDelegate\` that:
- Reads route values
- Binds parameters
- Writes the response

### Sync vs Async Handlers

\`\`\`csharp
// Sync - framework wraps in Task
app.MapGet("/sync", () => "Hello");

// Async - you return Task
app.MapGet("/async", async () => {
    await Task.Delay(100);
    return "Hello";
});
\`\`\`

### Anti-Pattern: Ignoring Return Values and Blocking

\`\`\`csharp
// ❌ ANTI-PATTERN: ASP0016 - Return value discarded
app.MapGet("/bad", () => Task.FromResult("Hello"));  // Returns Task, not string!

// ❌ ANTI-PATTERN: Blocking async in sync handler
app.MapGet("/blocking", () =>
{
    var result = GetDataAsync().Result;  // Blocks thread pool thread!
    return result;
});

// ❌ ANTI-PATTERN: Heavy computation without consideration
app.MapGet("/compute", () =>
{
    Thread.Sleep(5000);  // Blocks a thread for 5 seconds!
    return "Done";
});

// ✅ CORRECT: Return value directly
app.MapGet("/good", () => "Hello");

// ✅ CORRECT: Use async/await properly
app.MapGet("/async", async () =>
{
    var result = await GetDataAsync();  // Non-blocking
    return result;
});

// ✅ CORRECT: Use Results for explicit responses
app.MapGet("/explicit", () => Results.Ok("Hello"));
\`\`\`

**Why it's bad:** Discarded return values confuse readers. Blocking calls (.Result, .Wait()) cause thread pool starvation.

### Your Task

Simulate the route handler pattern: create a router that maps paths to handlers.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    private readonly Dictionary<string, Func<Dictionary<string, string>, string>> _routes = new();

    // Register a route handler
    public void MapGet(string path, Func<Dictionary<string, string>, string> handler)
    {
        // Your code here
        throw new NotImplementedException();
    }

    // Handle a request
    public string HandleRequest(string path, Dictionary<string, string> routeValues)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var router = new Exercise();

        router.MapGet("/hello", _ => "Hello World!");
        router.MapGet("/users/{id}", rv => $"User {rv["id"]}");
        router.MapGet("/add", rv => $"Sum: {int.Parse(rv["a"]) + int.Parse(rv["b"])}");

        Console.WriteLine(router.HandleRequest("/hello", new()));
        Console.WriteLine(router.HandleRequest("/users/{id}", new() { ["id"] = "42" }));
        Console.WriteLine(router.HandleRequest("/add", new() { ["a"] = "3", ["b"] = "5" }));
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    private readonly Dictionary<string, Func<Dictionary<string, string>, string>> _routes = new();

    public void MapGet(string path, Func<Dictionary<string, string>, string> handler)
    {
        _routes[path] = handler;
    }

    public string HandleRequest(string path, Dictionary<string, string> routeValues)
    {
        if (_routes.TryGetValue(path, out var handler))
        {
            return handler(routeValues);
        }
        return "404 Not Found";
    }

    public static void Main()
    {
        var router = new Exercise();

        router.MapGet("/hello", _ => "Hello World!");
        router.MapGet("/users/{id}", rv => $"User {rv["id"]}");
        router.MapGet("/add", rv => $"Sum: {int.Parse(rv["a"]) + int.Parse(rv["b"])}");

        Console.WriteLine(router.HandleRequest("/hello", new()));
        Console.WriteLine(router.HandleRequest("/users/{id}", new() { ["id"] = "42" }));
        Console.WriteLine(router.HandleRequest("/add", new() { ["a"] = "3", ["b"] = "5" }));
    }
}`,
    testCode: `[
  { "name": "Simple route works", "path": "/hello", "routeValues": {}, "expected": "Hello World!" },
  { "name": "Route with parameter", "path": "/users/{id}", "routeValues": {"id": "42"}, "expected": "User 42" },
  { "name": "Route with multiple params", "path": "/add", "routeValues": {"a": "3", "b": "5"}, "expected": "Sum: 8" },
  { "name": "Unknown route returns 404", "path": "/unknown", "routeValues": {}, "expected": "404 Not Found" },
  { "name": "Different IDs work", "path": "/users/{id}", "routeValues": {"id": "99"}, "expected": "User 99" }
]`,
    hints: {
      "Simple route works": "Store the handler in _routes dictionary with path as key",
      "Route with parameter": "The handler receives routeValues and can access rv[\"id\"]",
      "Unknown route returns 404": "If the path isn't in _routes, return a 404 message",
    },
  },
  {
    id: "hto-background",
    title: "HTO-7: Background Callbacks",
    conceptTags: ["background", "timer", "HTO", "CancellationToken", "async"],
    order: 15,
    description: `## HTO Pattern: Background Callback

**Intent:** Schedule behavior to run later or repeatedly.

**Signature:** Often \`Func<CancellationToken, Task>\` or \`Action<object?>\`.

### Background Work Patterns

\`\`\`csharp
// Timer callback
var timer = new Timer(
    callback: state => Console.WriteLine("Tick!"),
    state: null,
    dueTime: 0,
    period: 1000);

// Background task with cancellation
async Task RunBackground(Func<CancellationToken, Task> work, CancellationToken ct)
{
    while (!ct.IsCancellationRequested)
    {
        await work(ct);
        await Task.Delay(1000, ct);
    }
}
\`\`\`

### ASP.NET Core BackgroundService

\`\`\`csharp
public class MyWorker : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // Do work
            await Task.Delay(1000, ct);
        }
    }
}
\`\`\`

### Anti-Pattern: Ignoring Cancellation and Exceptions

\`\`\`csharp
// ❌ ANTI-PATTERN: Ignoring CancellationToken
protected override async Task ExecuteAsync(CancellationToken ct)
{
    while (true)  // Never stops! Ignores ct
    {
        await DoWork();
        await Task.Delay(1000);  // Should pass ct!
    }
}

// ❌ ANTI-PATTERN: Swallowing exceptions silently
while (!ct.IsCancellationRequested)
{
    try { await DoWork(ct); }
    catch { }  // Exceptions disappear into the void!
}

// ❌ ANTI-PATTERN: Using scoped services without scope
public class MyWorker : BackgroundService
{
    private readonly DbContext _db;  // Injected DbContext is already disposed!

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        await _db.Users.ToListAsync();  // ObjectDisposedException!
    }
}

// ✅ CORRECT: Respect cancellation token everywhere
while (!ct.IsCancellationRequested)
{
    await DoWork(ct);
    await Task.Delay(1000, ct);  // Throws on cancellation
}

// ✅ CORRECT: Log exceptions, continue or stop appropriately
catch (Exception ex) when (ex is not OperationCanceledException)
{
    _logger.LogError(ex, "Background work failed");
}

// ✅ CORRECT: Create scope for scoped services
using var scope = _scopeFactory.CreateScope();
var db = scope.ServiceProvider.GetRequiredService<DbContext>();
\`\`\`

**Why it's bad:** Ignoring cancellation prevents graceful shutdown. Swallowed exceptions hide bugs. Wrong service lifetimes cause crashes.

### Your Task

Implement a simple scheduler that runs callbacks at specified intervals.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Simulate running callbacks for a number of "ticks"
    // Returns list of outputs from each tick
    public static List<string> RunSchedule(
        int ticks,
        Func<int, string> onTick)
    {
        // Your code here
        // Call onTick for each tick (0 to ticks-1) and collect results
        throw new NotImplementedException();
    }

    public static void Main()
    {
        var results = RunSchedule(5, tick => $"Tick {tick} at {DateTime.Now:HH:mm:ss}");
        foreach (var r in results)
            Console.WriteLine(r);
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    public static List<string> RunSchedule(
        int ticks,
        Func<int, string> onTick)
    {
        var results = new List<string>();
        for (int i = 0; i < ticks; i++)
        {
            results.Add(onTick(i));
        }
        return results;
    }

    public static void Main()
    {
        var results = RunSchedule(5, tick => $"Tick {tick}");
        foreach (var r in results)
            Console.WriteLine(r);
    }
}`,
    testCode: `[
  { "name": "5 ticks produces 5 results", "ticks": 5, "expectedCount": 5 },
  { "name": "0 ticks produces empty", "ticks": 0, "expectedCount": 0 },
  { "name": "Tick indices are correct", "ticks": 3, "expectedIndices": [0, 1, 2] },
  { "name": "Callback receives tick number", "ticks": 2, "expected": ["Tick 0", "Tick 1"] },
  { "name": "Single tick works", "ticks": 1, "expectedCount": 1 }
]`,
    hints: {
      "5 ticks produces 5 results": "Loop from 0 to ticks-1, calling onTick(i) each time",
      "0 ticks produces empty": "The loop doesn't execute, returning an empty list",
      "Tick indices are correct": "Pass the loop variable i to onTick",
    },
  },

  // ============================================
  // MODULE 4: ASP.NET CORE INTEGRATION
  // ============================================

  {
    id: "request-delegate",
    title: "RequestDelegate Anatomy",
    conceptTags: ["RequestDelegate", "HttpContext", "middleware", "pipeline"],
    order: 16,
    description: `## RequestDelegate: The Core Abstraction

**Definition:** \`Task RequestDelegate(HttpContext context)\`

This single delegate type is the foundation of ASP.NET Core's request pipeline.

### How the Pipeline Works

\`\`\`
Request → [Middleware 1] → [Middleware 2] → [Middleware 3] → Response
              ↓                ↓                ↓
          RequestDelegate  RequestDelegate  RequestDelegate
\`\`\`

Each middleware:
1. Receives \`HttpContext\`
2. Can modify request/response
3. Decides whether to call \`next()\`
4. Can do work after \`next()\` returns

### Building a Pipeline

\`\`\`csharp
app.Use(async (context, next) =>
{
    // Before
    Console.WriteLine($"Request: {context.Request.Path}");

    await next(context);  // Continue pipeline

    // After
    Console.WriteLine($"Response: {context.Response.StatusCode}");
});
\`\`\`

### Short-Circuiting

\`\`\`csharp
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/health")
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("OK");
        return; // Don't call next - short circuit!
    }
    await next(context);
});
\`\`\`

### Anti-Pattern: Response Body Mistakes

\`\`\`csharp
// ❌ ANTI-PATTERN: Writing after response has started
app.Use(async (ctx, next) =>
{
    await next(ctx);  // Response already sent!
    await ctx.Response.WriteAsync("Extra");  // InvalidOperationException!
});

// ❌ ANTI-PATTERN: Reading request body multiple times without buffering
app.Use(async (ctx, next) =>
{
    var body1 = await new StreamReader(ctx.Request.Body).ReadToEndAsync();
    var body2 = await new StreamReader(ctx.Request.Body).ReadToEndAsync();  // Empty!
    await next(ctx);
});

// ❌ ANTI-PATTERN: Not checking if response has started
app.Use(async (ctx, next) =>
{
    await next(ctx);
    ctx.Response.StatusCode = 500;  // May throw if headers already sent!
});

// ✅ CORRECT: Check HasStarted before modifying response
if (!context.Response.HasStarted)
{
    context.Response.StatusCode = 500;
}

// ✅ CORRECT: Enable request body buffering
ctx.Request.EnableBuffering();
ctx.Request.Body.Position = 0;  // Can now read multiple times
\`\`\`

**Why it's bad:** Writing to response after it started throws. Request body is forward-only by default. Not checking HasStarted causes runtime errors.

### Your Task

Simulate a request pipeline with multiple middleware components.`,
    skeleton: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class HttpContext
{
    public string Path { get; set; }
    public int StatusCode { get; set; } = 200;
    public string ResponseBody { get; set; } = "";
    public List<string> Log { get; } = new();
}

public class Exercise
{
    // Build a pipeline from middleware functions
    // Each middleware: (context, next) => Task
    public static Func<HttpContext, Task> BuildPipeline(
        List<Func<HttpContext, Func<Task>, Task>> middlewares)
    {
        // Your code here
        throw new NotImplementedException();
    }

    public static async Task Main()
    {
        var middlewares = new List<Func<HttpContext, Func<Task>, Task>>
        {
            async (ctx, next) => {
                ctx.Log.Add("MW1: Before");
                await next();
                ctx.Log.Add("MW1: After");
            },
            async (ctx, next) => {
                ctx.Log.Add("MW2: Before");
                await next();
                ctx.Log.Add("MW2: After");
            },
        };

        var pipeline = BuildPipeline(middlewares);
        var context = new HttpContext { Path = "/test" };
        await pipeline(context);

        Console.WriteLine(string.Join(" -> ", context.Log));
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class HttpContext
{
    public string Path { get; set; }
    public int StatusCode { get; set; } = 200;
    public string ResponseBody { get; set; } = "";
    public List<string> Log { get; } = new();
}

public class Exercise
{
    public static Func<HttpContext, Task> BuildPipeline(
        List<Func<HttpContext, Func<Task>, Task>> middlewares)
    {
        Func<HttpContext, Task> app = ctx => Task.CompletedTask;

        for (int i = middlewares.Count - 1; i >= 0; i--)
        {
            var middleware = middlewares[i];
            var next = app;
            app = ctx => middleware(ctx, () => next(ctx));
        }

        return app;
    }

    public static async Task Main()
    {
        var middlewares = new List<Func<HttpContext, Func<Task>, Task>>
        {
            async (ctx, next) => {
                ctx.Log.Add("MW1: Before");
                await next();
                ctx.Log.Add("MW1: After");
            },
            async (ctx, next) => {
                ctx.Log.Add("MW2: Before");
                await next();
                ctx.Log.Add("MW2: After");
            },
        };

        var pipeline = BuildPipeline(middlewares);
        var context = new HttpContext { Path = "/test" };
        await pipeline(context);

        Console.WriteLine(string.Join(" -> ", context.Log));
    }
}`,
    testCode: `[
  { "name": "Middlewares execute in order", "expected": ["MW1: Before", "MW2: Before", "MW2: After", "MW1: After"] },
  { "name": "Empty pipeline works", "middlewareCount": 0, "expectSuccess": true },
  { "name": "Single middleware works", "middlewareCount": 1, "expectedLogCount": 2 },
  { "name": "Context is passed through", "path": "/test", "expectPathPreserved": true },
  { "name": "Short-circuit stops chain", "shortCircuitAt": 0, "expectedLogCount": 1 }
]`,
    hints: {
      "Middlewares execute in order": "Build from inside out: terminal -> MW2 -> MW1. First middleware wraps all others.",
      "Empty pipeline works": "With no middlewares, return a function that just completes",
      "Short-circuit stops chain": "If a middleware doesn't call next(), subsequent middlewares don't run",
    },
  },
  {
    id: "middleware-perf",
    title: "Middleware Performance",
    conceptTags: ["performance", "allocations", "Use overloads", "ASP0016"],
    order: 17,
    description: `## Middleware Performance Pitfalls

### The Two \`Use\` Overloads

ASP.NET Core has two \`Use\` overloads with different performance characteristics:

\`\`\`csharp
// Overload 1: Takes Func<Task> - allocates per request!
app.Use(async (context, next) =>
{
    await next(); // 'next' is Func<Task>
});

// Overload 2: Takes HttpContext in next - preferred!
app.Use(async (context, next) =>
{
    await next(context); // 'next' is RequestDelegate
});
\`\`\`

**Why it matters:** The first overload allocates two objects per request. The second avoids this.

### ASP0016: Return Value Discarded

\`\`\`csharp
// WARNING: ASP0016 - return value discarded!
app.MapGet("/bad", () => Task.FromResult("Hello"));

// Correct: return the string directly
app.MapGet("/good", () => "Hello");

// Or use Results
app.MapGet("/also-good", () => Results.Ok("Hello"));
\`\`\`

### Closure Allocations

\`\`\`csharp
// Bad: captures 'logger' in closure - allocates per request
app.Use(async (ctx, next) =>
{
    logger.Log(ctx.Request.Path); // captures 'logger'
    await next(ctx);
});

// Better: inject via DI in a middleware class
\`\`\`

### Anti-Pattern: Excessive Allocations in Hot Paths

\`\`\`csharp
// ❌ ANTI-PATTERN: String concatenation in hot path
app.Use(async (ctx, next) =>
{
    var log = "Request to " + ctx.Request.Path + " at " + DateTime.Now;  // Allocates!
    Console.WriteLine(log);
    await next(ctx);
});

// ❌ ANTI-PATTERN: Boxing value types
app.Use(async (ctx, next) =>
{
    object statusCode = ctx.Response.StatusCode;  // Boxing!
    await next(ctx);
});

// ❌ ANTI-PATTERN: LINQ in hot paths
app.Use(async (ctx, next) =>
{
    var hasAuth = ctx.Request.Headers.Any(h => h.Key == "Authorization");  // Allocates iterator!
    await next(ctx);
});

// ✅ CORRECT: Use string interpolation with LoggerMessage
[LoggerMessage(Level = LogLevel.Information, Message = "Request to {Path}")]
static partial void LogRequest(ILogger logger, string path);

// ✅ CORRECT: Avoid boxing
int statusCode = ctx.Response.StatusCode;

// ✅ CORRECT: Use direct lookup instead of LINQ
var hasAuth = ctx.Request.Headers.ContainsKey("Authorization");
\`\`\`

**Why it's bad:** Every allocation adds GC pressure. In hot paths (every request), small allocations multiply into significant overhead.

### Your Task

Identify and fix performance issues in middleware code.`,
    skeleton: `using System;
using System.Collections.Generic;

public class Exercise
{
    // Count allocations in a simulated middleware scenario
    // Return the number of allocations that would occur for N requests

    public static int CountAllocations_Bad(int requestCount)
    {
        // Bad pattern: closure captures outer variable
        // Each request creates: 1 closure + 1 Func<Task>
        // Your code: return total allocations
        throw new NotImplementedException();
    }

    public static int CountAllocations_Good(int requestCount)
    {
        // Good pattern: no closures, uses RequestDelegate
        // Each request creates: 0 allocations (delegate reused)
        // Your code: return total allocations
        throw new NotImplementedException();
    }

    public static void Main()
    {
        int requests = 1000;
        Console.WriteLine($"Bad pattern: {CountAllocations_Bad(requests)} allocations");
        Console.WriteLine($"Good pattern: {CountAllocations_Good(requests)} allocations");
        Console.WriteLine($"Savings: {CountAllocations_Bad(requests) - CountAllocations_Good(requests)}");
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;

public class Exercise
{
    public static int CountAllocations_Bad(int requestCount)
    {
        // Bad pattern allocates 2 objects per request:
        // 1. Closure object to capture state
        // 2. Func<Task> delegate instance
        return requestCount * 2;
    }

    public static int CountAllocations_Good(int requestCount)
    {
        // Good pattern: delegate is created once and reused
        // 0 per-request allocations
        return 0;
    }

    public static void Main()
    {
        int requests = 1000;
        Console.WriteLine($"Bad pattern: {CountAllocations_Bad(requests)} allocations");
        Console.WriteLine($"Good pattern: {CountAllocations_Good(requests)} allocations");
        Console.WriteLine($"Savings: {CountAllocations_Bad(requests) - CountAllocations_Good(requests)}");
    }
}`,
    testCode: `[
  { "name": "Bad pattern: 1000 requests = 2000 allocations", "requests": 1000, "pattern": "bad", "expected": 2000 },
  { "name": "Good pattern: 1000 requests = 0 allocations", "requests": 1000, "pattern": "good", "expected": 0 },
  { "name": "Bad pattern: 0 requests = 0 allocations", "requests": 0, "pattern": "bad", "expected": 0 },
  { "name": "Bad pattern: 1 request = 2 allocations", "requests": 1, "pattern": "bad", "expected": 2 },
  { "name": "Good pattern scales to millions", "requests": 1000000, "pattern": "good", "expected": 0 }
]`,
    hints: {
      "Bad pattern: 1000 requests = 2000 allocations": "The bad Use overload creates 2 allocations per request: closure + Func<Task>",
      "Good pattern: 1000 requests = 0 allocations": "The good overload reuses the RequestDelegate - no per-request allocations",
      "Good pattern scales to millions": "With 0 allocations per request, it doesn't matter how many requests",
    },
  },
  {
    id: "capstone-api",
    title: "Capstone: Build a Mini API",
    conceptTags: ["capstone", "integration", "Minimal API", "middleware", "DI"],
    order: 18,
    description: `## Capstone: Putting It All Together

Build a mini API framework that combines all the HTO patterns you've learned:

1. **DI Factory** - Service registration with factories
2. **Middleware Pipeline** - Request processing chain
3. **Route Handlers** - Endpoint definitions
4. **Callbacks** - Logging and notifications
5. **Strategy** - Configurable behaviors

### The Mini Framework

\`\`\`csharp
var app = new MiniApp();

// Register services (HTO-5: DI Factory)
app.Services.Add<ILogger>(() => new ConsoleLogger());

// Add middleware (HTO-3: Pipeline)
app.Use(async (ctx, next) => {
    Console.WriteLine($"Request: {ctx.Path}");
    await next();
});

// Map routes (HTO-4: Route Handler)
app.MapGet("/hello", () => "Hello World!");
app.MapGet("/users/{id}", (int id) => $"User {id}");

// Run
await app.HandleRequest("/hello");
\`\`\`

### Anti-Pattern: Combining Multiple Bad Practices

\`\`\`csharp
// ❌ ANTI-PATTERN: Multiple issues in one piece of code
var app = new MiniApp();

// Issue 1: Capturing scoped service in singleton middleware
var db = app.Services.Get<DbContext>();
app.Use(async (ctx, next) =>
{
    // Issue 2: Blocking call
    var users = db.Users.ToList();  // DbContext disposed + blocking!

    // Issue 3: Not calling next in some paths
    if (users.Count == 0)
        return;  // Forgot await next()!

    // Issue 4: Loop closure bug
    foreach (var user in users)
    {
        app.MapGet($"/user/{user.Id}", () => user.Name);  // All return last user!
    }

    await next();
});

// ✅ CORRECT: Apply all learned patterns properly
app.Use(async (ctx, next) =>
{
    using var scope = app.CreateScope();  // Proper scoping
    var db = scope.Get<DbContext>();

    var users = await db.Users.ToListAsync();  // Async/await

    await next();  // Always call next (or explicitly short-circuit)
});

// Register routes outside middleware, capture properly
foreach (var user in users)
{
    var capturedName = user.Name;  // Capture copy
    app.MapGet($"/user/{user.Id}", () => capturedName);
}
\`\`\`

**Why it matters:** Real-world bugs often combine multiple anti-patterns. Recognizing them requires understanding all the HTO patterns.

### Your Task

Complete the \`MiniApp\` implementation that ties together all patterns.`,
    skeleton: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class RequestContext
{
    public string Path { get; set; }
    public Dictionary<string, string> RouteValues { get; } = new();
    public string Response { get; set; } = "";
    public List<string> Logs { get; } = new();
}

public class MiniApp
{
    private readonly Dictionary<string, Func<RequestContext, string>> _routes = new();
    private readonly List<Func<RequestContext, Func<Task>, Task>> _middleware = new();

    public void Use(Func<RequestContext, Func<Task>, Task> middleware)
    {
        // Your code: add middleware to the list
        throw new NotImplementedException();
    }

    public void MapGet(string path, Func<RequestContext, string> handler)
    {
        // Your code: register route handler
        throw new NotImplementedException();
    }

    public async Task<string> HandleRequest(string path, Dictionary<string, string> routeValues = null)
    {
        // Your code:
        // 1. Create context
        // 2. Build pipeline with middleware + endpoint
        // 3. Execute and return response
        throw new NotImplementedException();
    }
}

public class Exercise
{
    public static async Task Main()
    {
        var app = new MiniApp();

        // Logging middleware
        app.Use(async (ctx, next) => {
            ctx.Logs.Add($"[LOG] {ctx.Path}");
            await next();
            ctx.Logs.Add($"[LOG] Done");
        });

        // Routes
        app.MapGet("/hello", ctx => "Hello World!");
        app.MapGet("/greet/{name}", ctx => $"Hello, {ctx.RouteValues["name"]}!");

        // Test
        var response = await app.HandleRequest("/hello");
        Console.WriteLine(response);

        response = await app.HandleRequest("/greet/{name}", new() { ["name"] = "Alice" });
        Console.WriteLine(response);
    }
}`,
    referenceSolution: `using System;
using System.Collections.Generic;
using System.Threading.Tasks;

public class RequestContext
{
    public string Path { get; set; }
    public Dictionary<string, string> RouteValues { get; } = new();
    public string Response { get; set; } = "";
    public List<string> Logs { get; } = new();
}

public class MiniApp
{
    private readonly Dictionary<string, Func<RequestContext, string>> _routes = new();
    private readonly List<Func<RequestContext, Func<Task>, Task>> _middleware = new();

    public void Use(Func<RequestContext, Func<Task>, Task> middleware)
    {
        _middleware.Add(middleware);
    }

    public void MapGet(string path, Func<RequestContext, string> handler)
    {
        _routes[path] = handler;
    }

    public async Task<string> HandleRequest(string path, Dictionary<string, string> routeValues = null)
    {
        var context = new RequestContext { Path = path };
        if (routeValues != null)
        {
            foreach (var kv in routeValues)
                context.RouteValues[kv.Key] = kv.Value;
        }

        // Build pipeline: terminal is the route handler
        Func<Task> terminal = () =>
        {
            if (_routes.TryGetValue(path, out var handler))
                context.Response = handler(context);
            else
                context.Response = "404 Not Found";
            return Task.CompletedTask;
        };

        // Wrap with middleware (reverse order)
        var next = terminal;
        for (int i = _middleware.Count - 1; i >= 0; i--)
        {
            var mw = _middleware[i];
            var currentNext = next;
            next = () => mw(context, currentNext);
        }

        await next();
        return context.Response;
    }
}

public class Exercise
{
    public static async Task Main()
    {
        var app = new MiniApp();

        app.Use(async (ctx, next) => {
            ctx.Logs.Add($"[LOG] {ctx.Path}");
            await next();
            ctx.Logs.Add($"[LOG] Done");
        });

        app.MapGet("/hello", ctx => "Hello World!");
        app.MapGet("/greet/{name}", ctx => $"Hello, {ctx.RouteValues["name"]}!");

        var response = await app.HandleRequest("/hello");
        Console.WriteLine(response);

        response = await app.HandleRequest("/greet/{name}", new() { ["name"] = "Alice" });
        Console.WriteLine(response);
    }
}`,
    testCode: `[
  { "name": "Simple route returns response", "path": "/hello", "expected": "Hello World!" },
  { "name": "Route with parameter works", "path": "/greet/{name}", "routeValues": {"name": "Alice"}, "expected": "Hello, Alice!" },
  { "name": "Unknown route returns 404", "path": "/unknown", "expected": "404 Not Found" },
  { "name": "Middleware executes", "path": "/hello", "expectLogsContain": "[LOG]" },
  { "name": "Multiple middleware chain correctly", "middlewareCount": 2, "expectOrderPreserved": true }
]`,
    hints: {
      "Simple route returns response": "Look up the path in _routes and call the handler with context",
      "Route with parameter works": "Route values should be copied to context.RouteValues before handling",
      "Middleware executes": "Build the pipeline by wrapping the terminal handler with each middleware in reverse order",
    },
  },
];
