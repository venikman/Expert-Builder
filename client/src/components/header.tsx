import { Code2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Lesson } from "@shared/schema";

interface HeaderProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
}

export function Header({ lessons, currentLessonIndex, onLessonChange }: HeaderProps) {
  const currentLesson = lessons[currentLessonIndex];
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex < lessons.length - 1;

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
        <ThemeToggle />
      </div>
    </header>
  );
}
