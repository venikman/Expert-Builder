import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
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
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match;
                
                if (isInline) {
                  return (
                    <code 
                      className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                
                const language = match ? match[1] : "text";
                const codeString = String(children).replace(/\n$/, "");
                
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={language === "csharp" ? "csharp" : language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                );
              },
              pre: ({ children }) => <>{children}</>,
              h2: ({ children }) => (
                <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mb-4 space-y-1 text-muted-foreground">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-4 space-y-1 text-muted-foreground">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="leading-relaxed">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">
                  {children}
                </blockquote>
              ),
            }}
          >
            {lesson.description}
          </ReactMarkdown>
        </div>
      </ScrollArea>
    </div>
  );
}
