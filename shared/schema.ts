import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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

export const animationStepSchema = z.object({
  type: z.enum(["camera", "highlight", "annotate", "pause"]),
  target: z.string().optional(),
  duration: z.number(),
  data: z.record(z.any()).optional(),
});

export type AnimationStep = z.infer<typeof animationStepSchema>;

export const lessonAnimationSchema = z.object({
  sceneData: z.record(z.any()),
  steps: z.array(animationStepSchema),
});

export type LessonAnimation = z.infer<typeof lessonAnimationSchema>;

export const lessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  conceptTags: z.array(z.string()),
  description: z.string(),
  skeleton: z.string(),
  referenceSolution: z.string(),
  testCode: z.string(),
  hints: z.record(z.string()),
  order: z.number(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export const submissionSchema = z.object({
  id: z.string(),
  lessonId: z.string(),
  code: z.string(),
  result: submissionResultSchema,
  submittedAt: z.string(),
});

export type Submission = z.infer<typeof submissionSchema>;

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
