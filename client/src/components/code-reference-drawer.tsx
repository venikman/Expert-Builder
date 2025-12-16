import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Copy, Check, Code2 } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import type { CodeExample } from "@shared/schema";

interface CodeReferenceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codeExamples: CodeExample[];
  lessonId: string;
  lessonTitle: string;
}

export function CodeReferenceDrawer({
  open,
  onOpenChange,
  codeExamples,
  lessonId,
  lessonTitle,
}: CodeReferenceDrawerProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const copyToClipboard = useCallback(async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      const example = codeExamples[index];
      track("code_example_copied", {
        lesson_id: lessonId,
        example_index: index,
        example_title: example?.title,
        language: example?.language,
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setCopiedIndex(index);
      timeoutRef.current = setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      track("code_example_copy_failed", {
        lesson_id: lessonId,
        example_index: index,
      });
      console.error("Failed to copy:", err);
    }
  }, [codeExamples, lessonId]);

  if (codeExamples.length === 0) {
    return null;
  }

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <DrawerTitle>Reference Examples</DrawerTitle>
            <span className="text-sm text-muted-foreground">
              — {lessonTitle}
            </span>
          </div>
          <DrawerClose
            render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>

        <ScrollArea className="flex-1">
          <div className="px-4 py-4">
            <div className="space-y-6">
              {codeExamples.map((example, index) => (
                <div
                  key={index}
                  className="rounded-none ring-foreground/10 bg-card overflow-hidden ring-1"
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
                    <span className="text-sm font-medium">{example.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => copyToClipboard(example.code, index)}
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-0">
                    <Streamdown
                      mode="static"
                      shikiTheme={["github-light", "github-dark"]}
                      controls={{ code: false }}
                      remarkRehypeOptions={{ allowDangerousHtml: false }}
                    >
                      {`\`\`\`${example.language}\n${example.code}\n\`\`\``}
                    </Streamdown>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
