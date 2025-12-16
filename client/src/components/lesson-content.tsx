import { Streamdown } from "streamdown";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Lesson } from "@shared/schema";

interface LessonContentProps {
  lesson: Lesson;
}

export function LessonContent({ lesson }: LessonContentProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-0">
        <h1 className="text-3xl font-bold mb-4" data-testid="text-lesson-heading">
          {lesson.title}
        </h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {lesson.conceptTags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="rounded-full px-3 py-1 text-xs font-medium"
              data-testid={`badge-concept-${index}`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <Streamdown
            mode="static"
            shikiTheme={["github-light", "github-dark"]}
            className="streamdown-content"
          >
            {lesson.description}
          </Streamdown>
        </div>
      </ScrollArea>
    </div>
  );
}
