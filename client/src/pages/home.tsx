import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { LessonPage } from "@/components/lesson-page";
import { Skeleton } from "@/components/ui/skeleton";
import type { Lesson, LessonAnimation } from "@shared/schema";

export default function Home() {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const { data: lessons = [], isLoading: isLoadingLessons } = useQuery<Lesson[]>({
    queryKey: ["/api/lessons"],
  });

  const currentLesson = lessons[currentLessonIndex];

  const { data: animation, isLoading: isLoadingAnimation } = useQuery<LessonAnimation>({
    queryKey: ["/api/lessons", currentLesson?.id, "animation"],
    enabled: !!currentLesson?.id,
  });

  const handleLessonChange = (index: number) => {
    if (index >= 0 && index < lessons.length) {
      setCurrentLessonIndex(index);
    }
  };

  if (isLoadingLessons) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="h-16 border-b flex items-center justify-between px-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>
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
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        lessons={lessons}
        currentLessonIndex={currentLessonIndex}
        onLessonChange={handleLessonChange}
      />
      <main className="flex-1 min-h-0">
        <LessonPage
          lesson={currentLesson || null}
          animation={animation || null}
          isLoadingLesson={isLoadingLessons}
          isLoadingAnimation={isLoadingAnimation}
        />
      </main>
    </div>
  );
}
