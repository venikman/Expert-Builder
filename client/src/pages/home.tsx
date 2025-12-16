import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { LessonPage } from "@/components/lesson-page";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lesson } from "@shared/schema";

export function HomeSkeleton() {
  return (
    <div className="h-screen flex flex-col bg-background max-w-screen-2xl mx-auto">
      <div className="flex-1 flex">
        <div className="w-2/5 p-6 space-y-4 border-r">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
      <footer className="h-12 border-t flex items-center justify-between px-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-7 w-8 rounded-full" />
      </footer>
    </div>
  );
}

export default function Home() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const { data: lessons = [] } = useSuspenseQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const currentLesson = lessons[currentLessonIndex];

  const handleLessonChange = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentLessonIndex(index);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background max-w-screen-2xl mx-auto">
      <main className="flex-1 min-h-0">
        <LessonPage
          lesson={currentLesson || null}
          isLoadingLesson={false}
        />
      </main>
      <Header
        lessons={lessons}
        currentLessonIndex={currentLessonIndex}
        onLessonChange={handleLessonChange}
      />
    </div>
  );
}
