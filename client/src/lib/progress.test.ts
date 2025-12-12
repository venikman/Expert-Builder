import { beforeEach, expect, test } from "bun:test";
import { markLessonCompleted, readLessonProgress } from "./progress";

beforeEach(() => {
  localStorage.clear();
});

test("readLessonProgress returns empty when none stored", () => {
  expect(readLessonProgress()).toEqual({});
});

test("markLessonCompleted persists completion", () => {
  const progress = markLessonCompleted("lesson-1");
  expect(progress["lesson-1"].completed).toBe(true);

  const stored = readLessonProgress();
  expect(stored["lesson-1"].completed).toBe(true);
});

test("markLessonCompleted does not overwrite existing timestamp", () => {
  const first = markLessonCompleted("lesson-1");
  const firstAt = first["lesson-1"].completedAt;

  const second = markLessonCompleted("lesson-1");
  expect(second["lesson-1"].completedAt).toBe(firstAt);
});

