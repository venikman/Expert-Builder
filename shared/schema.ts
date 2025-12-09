import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("learner"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const lessons = pgTable("lessons", {
  id: varchar("id", { length: 255 }).primaryKey(),
  title: text("title").notNull(),
  conceptTags: text("concept_tags").array().notNull().default([]),
  description: text("description").notNull(),
  skeleton: text("skeleton").notNull(),
  referenceSolution: text("reference_solution").notNull(),
  testCode: text("test_code").notNull(),
  hints: jsonb("hints").notNull().default({}),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessons.$inferSelect;

export const lessonAnimations = pgTable("lesson_animations", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lesson_id", { length: 255 }).notNull().references(() => lessons.id, { onDelete: "cascade" }),
  sceneData: jsonb("scene_data").notNull(),
  steps: jsonb("steps").notNull(),
});

export const insertLessonAnimationSchema = createInsertSchema(lessonAnimations).omit({
  id: true,
});

export type InsertLessonAnimation = z.infer<typeof insertLessonAnimationSchema>;
export type LessonAnimationRow = typeof lessonAnimations.$inferSelect;

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  lessonId: varchar("lesson_id", { length: 255 }).notNull().references(() => lessons.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  result: jsonb("result").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type SubmissionRow = typeof submissions.$inferSelect;

export const learnerProgress = pgTable("learner_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id", { length: 255 }).notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completed: boolean("completed").notNull().default(false),
  bestScore: integer("best_score").default(0),
  attempts: integer("attempts").notNull().default(0),
  lastAttemptAt: timestamp("last_attempt_at"),
  completedAt: timestamp("completed_at"),
});

export const insertLearnerProgressSchema = createInsertSchema(learnerProgress).omit({
  id: true,
});

export type InsertLearnerProgress = z.infer<typeof insertLearnerProgressSchema>;
export type LearnerProgress = typeof learnerProgress.$inferSelect;

export const lessonsRelations = relations(lessons, ({ many }) => ({
  submissions: many(submissions),
  animations: many(lessonAnimations),
  progress: many(learnerProgress),
}));

export const usersRelations = relations(users, ({ many }) => ({
  submissions: many(submissions),
  progress: many(learnerProgress),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  lesson: one(lessons, {
    fields: [submissions.lessonId],
    references: [lessons.id],
  }),
  user: one(users, {
    fields: [submissions.userId],
    references: [users.id],
  }),
}));

export const lessonAnimationsRelations = relations(lessonAnimations, ({ one }) => ({
  lesson: one(lessons, {
    fields: [lessonAnimations.lessonId],
    references: [lessons.id],
  }),
}));

export const learnerProgressRelations = relations(learnerProgress, ({ one }) => ({
  user: one(users, {
    fields: [learnerProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [learnerProgress.lessonId],
    references: [lessons.id],
  }),
}));

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
