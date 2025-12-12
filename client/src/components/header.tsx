import { useState } from "react";
import { Code2, ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSuspenseQuery } from "@tanstack/react-query";
import { readLessonProgress } from "@/lib/progress";
import type { Lesson } from "@shared/schema";

interface HeaderProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
}

export function Header({ lessons, currentLessonIndex, onLessonChange }: HeaderProps) {
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const currentLesson = lessons[currentLessonIndex];
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex < lessons.length - 1;

  const { data: progress = {} } = useSuspenseQuery({
    queryKey: ["lesson-progress"],
    queryFn: () => Promise.resolve(readLessonProgress()),
    staleTime: Infinity,
  });

  const completedCount = lessons.filter((l) => progress[l.id]?.completed).length;
  const percentComplete = lessons.length
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 gap-4 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-md">
            <Code2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg hidden sm:inline" data-testid="text-app-title">
            FP C# Academy
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-1 justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onLessonChange(currentLessonIndex - 1)}
          disabled={!canGoPrev}
          data-testid="button-prev-lesson"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">Lesson</span>
          <Badge variant="secondary" className="font-mono" data-testid="badge-lesson-number">
            {currentLessonIndex + 1}/{lessons.length}
          </Badge>
          {currentLesson && (
            <span className="text-sm font-medium max-w-[200px] truncate hidden md:inline" data-testid="text-lesson-title">
              {currentLesson.title}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onLessonChange(currentLessonIndex + 1)}
          disabled={!canGoNext}
          data-testid="button-next-lesson"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="hidden sm:flex items-center gap-3 mr-1 rounded-md px-2 py-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Open lesson progress"
            >
              <div className="flex flex-col items-end leading-none">
                <span className="text-[11px] text-muted-foreground">Progress</span>
                <span className="text-xs font-mono text-foreground">
                  {completedCount}/{lessons.length}
                </span>
              </div>
              <div className="w-20">
                <Progress value={percentComplete} className="h-2" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Lesson Progress</DialogTitle>
              <DialogDescription>
                Completed {completedCount} of {lessons.length} lessons
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const completed = progress[lesson.id]?.completed;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => {
                      onLessonChange(index);
                      setIsProgressOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-3 rounded-md border p-3 text-left hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-chart-5 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {index + 1}. {lesson.title}
                        </div>
                        {lesson.conceptTags.length > 0 && (
                          <div className="text-xs text-muted-foreground truncate">
                            {lesson.conceptTags.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    {completed && (
                      <Badge variant="secondary" className="font-mono text-[11px]">
                        Done
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
        <ThemeToggle />
      </div>
    </header>
  );
}
