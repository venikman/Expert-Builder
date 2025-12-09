import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { Play, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "@/components/theme-provider";

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
}

export function CodeEditor({
  code,
  onCodeChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);

  const handleEditorMount = useCallback(() => {
    setIsEditorReady(true);
  }, []);

  const handleEditorChange = useCallback((value: string | undefined) => {
    onCodeChange(value || "");
  }, [onCodeChange]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-2" />
          <span className="text-sm font-medium text-muted-foreground font-mono">
            Exercise.cs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRun}
            disabled={isRunning || isSubmitting}
            data-testid="button-run-code"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={isRunning || isSubmitting}
            data-testid="button-submit-code"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Grading
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {!isEditorReady && (
          <div className="absolute inset-0 p-4 space-y-2 bg-background z-10">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}
        <Editor
          height="100%"
          language="csharp"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 21,
            fontFamily: "'JetBrains Mono', Menlo, Monaco, 'Courier New', monospace",
            fontLigatures: true,
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            matchBrackets: "always",
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            lineNumbers: "on",
            lineNumbersMinChars: 4,
            glyphMargin: false,
            folding: true,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
          }}
        />
      </div>
    </div>
  );
}
