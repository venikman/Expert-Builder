import { z } from "zod";

// Lesson type (stored in codebase)
export interface Lesson {
  id: string;
  title: string;
  conceptTags: string[];
  description: string;
  skeleton: string;
  referenceSolution: string;
  testCode: string;
  hints: Record<string, string>;
  order: number;
}

export const testResultSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  message: z.string().optional(),
});

export type TestResult = z.infer<typeof testResultSchema>;

export const submissionResultSchema = z.object({
  success: z.boolean(),
  totalTests: z.number(),
  passedTests: z.number(),
  results: z.array(testResultSchema),
  hint: z.string().optional(),
});

export type SubmissionResult = z.infer<typeof submissionResultSchema>;

export const executeResultSchema = z.object({
  success: z.boolean(),
  output: z.string(),
  error: z.string().optional(),
  executionTime: z.number().optional(),
});

export type ExecuteResult = z.infer<typeof executeResultSchema>;

export const executeRequestSchema = z.object({
  code: z.string(),
  lessonId: z.string(),
});

export type ExecuteRequest = z.infer<typeof executeRequestSchema>;

export const submitRequestSchema = z.object({
  code: z.string(),
  lessonId: z.string(),
});

export type SubmitRequest = z.infer<typeof submitRequestSchema>;

export const consoleLineSchema = z.object({
  type: z.enum(["stdout", "stderr", "info"]),
  content: z.string(),
  timestamp: z.number(),
});

export type ConsoleLine = z.infer<typeof consoleLineSchema>;

export const diagnosticSchema = z.object({
  line: z.number(),
  column: z.number(),
  endLine: z.number().optional(),
  endColumn: z.number().optional(),
  severity: z.enum(["error", "warning", "info"]),
  message: z.string(),
  code: z.string().optional(),
});

export type Diagnostic = z.infer<typeof diagnosticSchema>;

// Infrastructure error codes to filter out (build system noise, not actual code errors)
export const INFRASTRUCTURE_ERROR_CODES = new Set([
  "NETSDK1004", // Assets file not found (NuGet restore)
  "NETSDK1045", // SDK not found
  "MSB4236",    // SDK not found
  "NU1100",     // Unable to resolve package
  "NU1101",     // Package not found
  "NU1102",     // Package version not found
  "NU1103",     // No versions found
]);

// Filter function to identify actual code errors vs infrastructure noise
export function isCodeError(d: Diagnostic): boolean {
  if (d.code && INFRASTRUCTURE_ERROR_CODES.has(d.code)) return false;
  if (d.message.includes("Assets file") || d.message.includes("NuGet package restore")) return false;
  return true;
}
