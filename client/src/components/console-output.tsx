import { useEffect, useRef } from "react";
import { Terminal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConsoleLine } from "@shared/schema";

interface ConsoleOutputProps {
  lines: ConsoleLine[];
  onClear: () => void;
}

export function ConsoleOutput({ lines, onClear }: ConsoleOutputProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Console</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          disabled={lines.length === 0}
          aria-label="Clear console output"
          data-testid="button-clear-console"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="p-3 font-mono text-console space-y-1">
          {lines.length === 0 ? (
            <div className="text-muted-foreground/60 text-center py-8">
              <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Run your code to see output here</p>
            </div>
          ) : (
            lines.map((line, index) => (
              <div
                key={index}
                className={`flex gap-2 ${
                  line.type === "stderr"
                    ? "text-destructive bg-destructive/10 rounded px-2 py-0.5 -mx-2"
                    : line.type === "info"
                    ? "text-muted-foreground"
                    : "text-foreground"
                }`}
                data-testid={`console-line-${index}`}
              >
                <span className="text-muted-foreground/60 shrink-0 select-none">
                  {formatTimestamp(line.timestamp)}
                </span>
                <span className="whitespace-pre-wrap break-all">{line.content}</span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
