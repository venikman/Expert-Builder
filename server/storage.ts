import type { Lesson, SubmissionResult } from "@shared/schema";
import { lessons } from "./lessons-data";

export interface IStorage {
  getLessons(): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
}

export class FileStorage implements IStorage {
  async getLessons(): Promise<Lesson[]> {
    return lessons.sort((a, b) => a.order - b.order);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    return lessons.find(lesson => lesson.id === id);
  }
}

export const storage = new FileStorage();
