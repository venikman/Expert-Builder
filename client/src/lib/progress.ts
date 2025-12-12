export type LessonProgressEntry = {
  completed: boolean;
  completedAt: number;
};

export type LessonProgress = Record<string, LessonProgressEntry>;

const STORAGE_KEY = "lesson-progress";

export function readLessonProgress(): LessonProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as LessonProgress;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLessonProgress(progress: LessonProgress): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markLessonCompleted(lessonId: string): LessonProgress {
  const progress = readLessonProgress();
  if (!progress[lessonId]?.completed) {
    progress[lessonId] = {
      completed: true,
      completedAt: Date.now(),
    };
    writeLessonProgress(progress);
  }
  return progress;
}

