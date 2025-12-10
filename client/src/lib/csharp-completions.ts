// Completion item definition without range (range is added dynamically)
interface CompletionItemDef {
  label: string;
  kind: number;
  insertText: string;
  insertTextRules: number;
  documentation: string;
  detail: string;
}

// Common C# types and their members for FP-style programming
const csharpCompletions: CompletionItemDef[] = [
  // LINQ methods
  {
    label: "Select",
    kind: 1, // Method
    insertText: "Select(${1:x} => ${2:x})",
    insertTextRules: 4, // InsertAsSnippet
    documentation: "Projects each element of a sequence into a new form (map operation)",
    detail: "IEnumerable<TResult> Select<TSource, TResult>(Func<TSource, TResult> selector)",
  },
  {
    label: "Where",
    kind: 1,
    insertText: "Where(${1:x} => ${2:condition})",
    insertTextRules: 4,
    documentation: "Filters a sequence based on a predicate (filter operation)",
    detail: "IEnumerable<TSource> Where<TSource>(Func<TSource, bool> predicate)",
  },
  {
    label: "Aggregate",
    kind: 1,
    insertText: "Aggregate(${1:seed}, (${2:acc}, ${3:x}) => ${4:acc + x})",
    insertTextRules: 4,
    documentation: "Applies an accumulator function over a sequence (reduce/fold operation)",
    detail: "TAccumulate Aggregate<TSource, TAccumulate>(TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func)",
  },
  {
    label: "ToList",
    kind: 1,
    insertText: "ToList()",
    insertTextRules: 4,
    documentation: "Creates a List<T> from an IEnumerable<T>",
    detail: "List<TSource> ToList<TSource>()",
  },
  {
    label: "ToArray",
    kind: 1,
    insertText: "ToArray()",
    insertTextRules: 4,
    documentation: "Creates an array from an IEnumerable<T>",
    detail: "TSource[] ToArray<TSource>()",
  },
  {
    label: "First",
    kind: 1,
    insertText: "First()",
    insertTextRules: 4,
    documentation: "Returns the first element of a sequence",
    detail: "TSource First<TSource>()",
  },
  {
    label: "FirstOrDefault",
    kind: 1,
    insertText: "FirstOrDefault()",
    insertTextRules: 4,
    documentation: "Returns the first element of a sequence, or a default value if no element is found",
    detail: "TSource? FirstOrDefault<TSource>()",
  },
  {
    label: "Any",
    kind: 1,
    insertText: "Any(${1:x} => ${2:condition})",
    insertTextRules: 4,
    documentation: "Determines whether any element of a sequence satisfies a condition",
    detail: "bool Any<TSource>(Func<TSource, bool> predicate)",
  },
  {
    label: "All",
    kind: 1,
    insertText: "All(${1:x} => ${2:condition})",
    insertTextRules: 4,
    documentation: "Determines whether all elements of a sequence satisfy a condition",
    detail: "bool All<TSource>(Func<TSource, bool> predicate)",
  },
  {
    label: "Count",
    kind: 1,
    insertText: "Count()",
    insertTextRules: 4,
    documentation: "Returns the number of elements in a sequence",
    detail: "int Count<TSource>()",
  },
  {
    label: "Sum",
    kind: 1,
    insertText: "Sum()",
    insertTextRules: 4,
    documentation: "Computes the sum of a sequence of numeric values",
    detail: "int Sum()",
  },
  {
    label: "Average",
    kind: 1,
    insertText: "Average()",
    insertTextRules: 4,
    documentation: "Computes the average of a sequence of numeric values",
    detail: "double Average()",
  },
  {
    label: "Max",
    kind: 1,
    insertText: "Max()",
    insertTextRules: 4,
    documentation: "Returns the maximum value in a sequence",
    detail: "TSource Max<TSource>()",
  },
  {
    label: "Min",
    kind: 1,
    insertText: "Min()",
    insertTextRules: 4,
    documentation: "Returns the minimum value in a sequence",
    detail: "TSource Min<TSource>()",
  },
  {
    label: "OrderBy",
    kind: 1,
    insertText: "OrderBy(${1:x} => ${2:x})",
    insertTextRules: 4,
    documentation: "Sorts the elements of a sequence in ascending order",
    detail: "IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(Func<TSource, TKey> keySelector)",
  },
  {
    label: "OrderByDescending",
    kind: 1,
    insertText: "OrderByDescending(${1:x} => ${2:x})",
    insertTextRules: 4,
    documentation: "Sorts the elements of a sequence in descending order",
    detail: "IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(Func<TSource, TKey> keySelector)",
  },
  {
    label: "GroupBy",
    kind: 1,
    insertText: "GroupBy(${1:x} => ${2:x.Key})",
    insertTextRules: 4,
    documentation: "Groups the elements of a sequence by a key selector",
    detail: "IEnumerable<IGrouping<TKey, TSource>> GroupBy<TSource, TKey>(Func<TSource, TKey> keySelector)",
  },
  {
    label: "Distinct",
    kind: 1,
    insertText: "Distinct()",
    insertTextRules: 4,
    documentation: "Returns distinct elements from a sequence",
    detail: "IEnumerable<TSource> Distinct<TSource>()",
  },
  {
    label: "Take",
    kind: 1,
    insertText: "Take(${1:count})",
    insertTextRules: 4,
    documentation: "Returns a specified number of contiguous elements from the start of a sequence",
    detail: "IEnumerable<TSource> Take<TSource>(int count)",
  },
  {
    label: "Skip",
    kind: 1,
    insertText: "Skip(${1:count})",
    insertTextRules: 4,
    documentation: "Bypasses a specified number of elements in a sequence",
    detail: "IEnumerable<TSource> Skip<TSource>(int count)",
  },
  {
    label: "Zip",
    kind: 1,
    insertText: "Zip(${1:other}, (${2:a}, ${3:b}) => ${4:result})",
    insertTextRules: 4,
    documentation: "Applies a function to corresponding elements of two sequences",
    detail: "IEnumerable<TResult> Zip<TFirst, TSecond, TResult>(...)",
  },
  {
    label: "SelectMany",
    kind: 1,
    insertText: "SelectMany(${1:x} => ${2:x.Items})",
    insertTextRules: 4,
    documentation: "Projects each element and flattens the resulting sequences (flatMap)",
    detail: "IEnumerable<TResult> SelectMany<TSource, TResult>(Func<TSource, IEnumerable<TResult>> selector)",
  },
  // Common types
  {
    label: "List<T>",
    kind: 7, // Class
    insertText: "List<${1:int}>",
    insertTextRules: 4,
    documentation: "Represents a strongly typed list of objects",
    detail: "System.Collections.Generic.List<T>",
  },
  {
    label: "Dictionary<TKey, TValue>",
    kind: 7,
    insertText: "Dictionary<${1:string}, ${2:int}>",
    insertTextRules: 4,
    documentation: "Represents a collection of key/value pairs",
    detail: "System.Collections.Generic.Dictionary<TKey, TValue>",
  },
  {
    label: "Func<T, TResult>",
    kind: 7,
    insertText: "Func<${1:int}, ${2:int}>",
    insertTextRules: 4,
    documentation: "Encapsulates a method with one parameter and returns a value",
    detail: "System.Func<T, TResult>",
  },
  {
    label: "Action<T>",
    kind: 7,
    insertText: "Action<${1:int}>",
    insertTextRules: 4,
    documentation: "Encapsulates a method with one parameter and no return value",
    detail: "System.Action<T>",
  },
  // Snippets for common patterns
  {
    label: "lambda",
    kind: 27, // Snippet
    insertText: "(${1:x}) => ${2:expression}",
    insertTextRules: 4,
    documentation: "Lambda expression",
    detail: "Lambda expression snippet",
  },
  {
    label: "foreach",
    kind: 27,
    insertText: "foreach (var ${1:item} in ${2:collection})\n{\n    ${3}\n}",
    insertTextRules: 4,
    documentation: "Foreach loop",
    detail: "Foreach loop snippet",
  },
  {
    label: "if",
    kind: 27,
    insertText: "if (${1:condition})\n{\n    ${2}\n}",
    insertTextRules: 4,
    documentation: "If statement",
    detail: "If statement snippet",
  },
  {
    label: "switch expression",
    kind: 27,
    insertText: "${1:value} switch\n{\n    ${2:pattern} => ${3:result},\n    _ => ${4:default}\n}",
    insertTextRules: 4,
    documentation: "Switch expression (C# 8+)",
    detail: "Pattern matching switch expression",
  },
  {
    label: "record",
    kind: 27,
    insertText: "public record ${1:Name}(${2:string Property});",
    insertTextRules: 4,
    documentation: "Record type declaration",
    detail: "Record type snippet",
  },
  // Option type pattern
  {
    label: "Some<T>",
    kind: 7,
    insertText: "new Some<${1:int}>(${2:value})",
    insertTextRules: 4,
    documentation: "Creates a Some value (Option pattern)",
    detail: "Option pattern - Some value",
  },
  {
    label: "None<T>",
    kind: 7,
    insertText: "new None<${1:int}>()",
    insertTextRules: 4,
    documentation: "Creates a None value (Option pattern)",
    detail: "Option pattern - None value",
  },
  // Console methods
  {
    label: "Console.WriteLine",
    kind: 1,
    insertText: "Console.WriteLine(${1:message})",
    insertTextRules: 4,
    documentation: "Writes the specified data followed by a newline to the console",
    detail: "void Console.WriteLine(object? value)",
  },
  {
    label: "Console.Write",
    kind: 1,
    insertText: "Console.Write(${1:message})",
    insertTextRules: 4,
    documentation: "Writes the specified data to the console",
    detail: "void Console.Write(object? value)",
  },
  // String methods
  {
    label: "string.Join",
    kind: 1,
    insertText: "string.Join(${1:\", \"}, ${2:items})",
    insertTextRules: 4,
    documentation: "Concatenates elements of an array using a separator",
    detail: "string string.Join(string separator, IEnumerable<T> values)",
  },
  // Math
  {
    label: "Math.Abs",
    kind: 1,
    insertText: "Math.Abs(${1:value})",
    insertTextRules: 4,
    documentation: "Returns the absolute value of a number",
    detail: "int Math.Abs(int value)",
  },
  {
    label: "Math.Max",
    kind: 1,
    insertText: "Math.Max(${1:a}, ${2:b})",
    insertTextRules: 4,
    documentation: "Returns the larger of two numbers",
    detail: "int Math.Max(int val1, int val2)",
  },
  {
    label: "Math.Min",
    kind: 1,
    insertText: "Math.Min(${1:a}, ${2:b})",
    insertTextRules: 4,
    documentation: "Returns the smaller of two numbers",
    detail: "int Math.Min(int val1, int val2)",
  },
];

// Register C# completions with Monaco
export function registerCSharpCompletions(monaco: typeof import("monaco-editor")) {
  monaco.languages.registerCompletionItemProvider("csharp", {
    triggerCharacters: [".", "("],
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      // Get the text before the cursor to determine context
      const textUntilPosition = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Check if we're after a dot (method call context)
      const isDotContext = textUntilPosition.trimEnd().endsWith(".");

      // Filter completions based on context
      let suggestions = csharpCompletions.map((item) => ({
        ...item,
        range,
      }));

      // If after a dot, prioritize methods
      if (isDotContext) {
        suggestions = suggestions.filter((s) => s.kind === 1); // Methods only
      }

      return { suggestions };
    },
  });
}

// C# keywords for syntax highlighting enhancement
export const csharpKeywords = [
  "abstract", "as", "base", "bool", "break", "byte", "case", "catch",
  "char", "checked", "class", "const", "continue", "decimal", "default",
  "delegate", "do", "double", "else", "enum", "event", "explicit",
  "extern", "false", "finally", "fixed", "float", "for", "foreach",
  "goto", "if", "implicit", "in", "int", "interface", "internal", "is",
  "lock", "long", "namespace", "new", "null", "object", "operator",
  "out", "override", "params", "private", "protected", "public",
  "readonly", "record", "ref", "return", "sbyte", "sealed", "short",
  "sizeof", "stackalloc", "static", "string", "struct", "switch",
  "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked",
  "unsafe", "ushort", "using", "var", "virtual", "void", "volatile", "while",
  // FP-related
  "Func", "Action", "Predicate", "Select", "Where", "Aggregate",
];
