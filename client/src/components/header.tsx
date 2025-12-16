import { useState } from "react";
import { Code2, ChevronLeft, ChevronRight, CheckCircle2, Circle, Lock } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Lesson } from "@shared/schema";

// Upcoming patterns from Ploeh blog research - DI & FP patterns for .NET
const UPCOMING_PATTERNS = [
  { title: "Composition Root", tags: ["DI", "architecture"] },
  { title: "Constructor Injection", tags: ["DI", "SOLID"] },
  { title: "Pure DI", tags: ["DI", "compile-time"] },
  { title: "Decoraptor Pattern", tags: ["DI", "lifetime"] },
  { title: "Railway-Oriented Programming", tags: ["FP", "error handling"] },
  { title: "Monads in C#", tags: ["FP", "LINQ"] },
  { title: "Immutable Collections", tags: ["FP", "data structures"] },
  { title: "Pattern Matching Advanced", tags: ["FP", "C# 11+"] },
  { title: "Service Locator Anti-Pattern", tags: ["DI", "anti-pattern"] },
  { title: "Captive Dependency", tags: ["DI", "hazard"] },
];

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
    <footer className="border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 grid grid-cols-[1fr_auto_1fr] items-center px-4 gap-4 h-12 z-50">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-md shrink-0" aria-hidden="true">
          <Code2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sm hidden sm:inline" data-testid="text-app-title">
          FP C# Academy
        </span>
        {currentLesson && (
          <span className="text-xs text-muted-foreground truncate hidden lg:inline" data-testid="text-lesson-title">
            {currentLesson.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 justify-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onLessonChange(currentLessonIndex - 1)}
          disabled={!canGoPrev}
          aria-label="Previous lesson"
          data-testid="button-prev-lesson"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="flex items-center gap-2 bg-muted/50 rounded-md px-3 py-1">
          <span className="text-xs text-muted-foreground hidden sm:inline">Lesson</span>
          <Badge variant="secondary" className="font-mono text-xs" data-testid="badge-lesson-number">
            {currentLessonIndex + 1}/{lessons.length}
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => onLessonChange(currentLessonIndex + 1)}
          disabled={!canGoNext}
          aria-label="Next lesson"
          data-testid="button-next-lesson"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Dialog open={isProgressOpen} onOpenChange={setIsProgressOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Open lesson progress"
            >
              <div className="flex flex-col items-end leading-none">
                <span className="text-xs text-muted-foreground hidden sm:inline">Progress</span>
                <span className="text-xs font-mono text-foreground">
                  {completedCount}/{lessons.length}
                </span>
              </div>
              <div className="w-16 hidden sm:block">
                <Progress value={percentComplete} className="h-1.5" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Lesson Progress</DialogTitle>
              <DialogDescription>
                Completed {completedCount} of {lessons.length} lessons
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="grid gap-6 md:grid-cols-2">
              <section>
                <h3 className="text-sm font-medium text-muted-foreground">Lessons</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2" role="list" aria-label="Lessons">
                  {lessons.map((lesson, index) => {
                    const completed = progress[lesson.id]?.completed;
                    const isCurrent = index === currentLessonIndex;
                    return (
                      <li key={lesson.id} role="listitem">
                        <button
                          type="button"
                          onClick={() => {
                            onLessonChange(index);
                            setIsProgressOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-left hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            isCurrent && "border-primary/60 bg-primary/5"
                          )}
                          aria-label={`Lesson ${index + 1}: ${lesson.title}${completed ? ", completed" : ""}${isCurrent ? ", current" : ""}`}
                          aria-current={isCurrent ? "true" : undefined}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {completed ? (
                              <CheckCircle2 className="h-4 w-4 text-chart-5 shrink-0" aria-hidden="true" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                            )}
                            <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                              {index + 1}.
                            </span>
                            <span className="text-sm font-medium truncate">{lesson.title}</span>
                          </div>
                          {completed && (
                            <Badge variant="secondary" className="font-mono text-[11px] h-5 px-2" aria-hidden="true">
                              Done
                            </Badge>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="md:pl-6 md:border-l">
                <h3 className="text-sm font-medium text-muted-foreground">Coming Soon</h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2" role="list" aria-label="Upcoming lessons">
                  {UPCOMING_PATTERNS.map((pattern, index) => (
                    <li
                      key={pattern.title}
                      role="listitem"
                      className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 opacity-60"
                    >
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
                      <span className="text-xs font-mono text-muted-foreground w-10 shrink-0">
                        {lessons.length + index + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-muted-foreground truncate">
                          {pattern.title}
                        </div>
                        <div className="text-xs text-muted-foreground/60 truncate hidden lg:block">
                          {pattern.tags.join(", ")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <ThemeToggle />
      </div>
    </footer>
  );
}
