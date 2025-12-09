import { Code2, ChevronLeft, ChevronRight, Settings, CheckCircle2, Circle, Trophy } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Lesson, LearnerProgress } from "@shared/schema";

interface HeaderProps {
  lessons: Lesson[];
  currentLessonIndex: number;
  onLessonChange: (index: number) => void;
  progress?: LearnerProgress[];
}

export function Header({ lessons, currentLessonIndex, onLessonChange, progress = [] }: HeaderProps) {
  const currentLesson = lessons[currentLessonIndex];
  const canGoPrev = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex < lessons.length - 1;

  const progressMap = new Map(progress.map(p => [p.lessonId, p]));
  const completedCount = progress.filter(p => p.completed).length;
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const currentLessonProgress = currentLesson ? progressMap.get(currentLesson.id) : undefined;

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
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden lg:flex items-center gap-2 ml-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <div className="w-24">
                <Progress value={overallProgress} className="h-2" data-testid="progress-overall" />
              </div>
              <span className="text-xs text-muted-foreground" data-testid="text-progress-count">
                {completedCount}/{lessons.length}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{overallProgress}% complete</p>
          </TooltipContent>
        </Tooltip>
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
            <>
              <span className="text-sm font-medium max-w-[200px] truncate hidden md:inline" data-testid="text-lesson-title">
                {currentLesson.title}
              </span>
              {currentLessonProgress?.completed ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" data-testid="icon-lesson-completed" />
              ) : currentLessonProgress && currentLessonProgress.attempts > 0 ? (
                <Tooltip>
                  <TooltipTrigger>
                    <Circle className="h-4 w-4 text-yellow-500" data-testid="icon-lesson-in-progress" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Best: {currentLessonProgress.bestScore}% ({currentLessonProgress.attempts} attempts)</p>
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </>
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
        <Link href="/instructor">
          <Button variant="ghost" size="icon" data-testid="button-instructor">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
