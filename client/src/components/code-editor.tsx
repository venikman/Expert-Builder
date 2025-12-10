import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Editor, { OnMount, Monaco } from "@monaco-editor/react";
import { initVimMode } from "monaco-vim";
import { Play, Send, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { registerCSharpCompletions } from "@/lib/csharp-completions";
import { apiRequest } from "@/lib/queryClient";
import type { editor } from "monaco-editor";
import type { Diagnostic } from "@shared/schema";
import { isCodeError } from "@shared/schema";

interface CodeEditorProps {
  code: string;
  lessonId?: string;
  skeleton?: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  onDiagnosticsChange?: (diagnostics: Diagnostic[]) => void;
}

export interface CodeEditorHandle {
  goToLine: (line: number, column: number) => void;
}

// Debounce helper
function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 24;

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(function CodeEditor({
  code,
  lessonId,
  skeleton,
  onCodeChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  onDiagnosticsChange,
}, ref) {
  const { resolvedTheme } = useTheme();
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [diagnosticsCount, setDiagnosticsCount] = useState(0);

  // Font size state
  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("editor-font-size");
      return saved ? parseInt(saved, 10) : DEFAULT_FONT_SIZE;
    }
    return DEFAULT_FONT_SIZE;
  });

  // Vim mode state
  const [vimEnabled, setVimEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("editor-vim-mode") === "true";
    }
    return false;
  });
  const vimModeRef = useRef<{ dispose: () => void } | null>(null);
  const statusBarRef = useRef<HTMLDivElement | null>(null);

  // Expose goToLine method via ref
  useImperativeHandle(ref, () => ({
    goToLine: (line: number, column: number) => {
      if (editorRef.current) {
        editorRef.current.setPosition({ lineNumber: line, column });
        editorRef.current.revealLineInCenter(line);
        editorRef.current.focus();
      }
    },
  }), []);

  // Fetch diagnostics from backend
  const fetchDiagnostics = useCallback(async (codeToCheck: string) => {
    if (!editorRef.current || !monacoRef.current || !codeToCheck.trim()) {
      onDiagnosticsChange?.([]);
      return;
    }

    try {
      const response = await apiRequest<{ diagnostics: Diagnostic[] }>(
        "POST",
        "/api/diagnostics",
        { code: codeToCheck, lessonId: lessonId || "unknown" }
      );

      const model = editorRef.current.getModel();
      if (!model || !monacoRef.current) return;

      // Filter out infrastructure errors
      const codeDiagnostics = response.diagnostics.filter(isCodeError);

      // Convert diagnostics to Monaco markers
      const markers: editor.IMarkerData[] = codeDiagnostics.map((d) => ({
        severity:
          d.severity === "error"
            ? monacoRef.current!.MarkerSeverity.Error
            : d.severity === "warning"
            ? monacoRef.current!.MarkerSeverity.Warning
            : monacoRef.current!.MarkerSeverity.Info,
        startLineNumber: d.line,
        startColumn: d.column,
        endLineNumber: d.endLine || d.line,
        endColumn: d.endColumn || d.column + 1,
        message: d.message,
        code: d.code,
        source: "C# Compiler",
      }));

      monacoRef.current.editor.setModelMarkers(model, "csharp", markers);
      setDiagnosticsCount(markers.filter(m => m.severity === monacoRef.current!.MarkerSeverity.Error).length);

      // Notify parent of diagnostics change (filtered)
      onDiagnosticsChange?.(codeDiagnostics);
    } catch (error) {
      // Silently fail - diagnostics are nice to have but not critical
      console.debug("Diagnostics fetch failed:", error);
      onDiagnosticsChange?.([]);
    }
  }, [lessonId, onDiagnosticsChange]);

  // Debounced diagnostics fetch (1.5 second delay to avoid hammering the server)
  const debouncedFetchDiagnostics = useDebouncedCallback(fetchDiagnostics, 1500);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    // Register C# completions
    registerCSharpCompletions(monaco);

    // Configure C# language settings
    monaco.languages.setLanguageConfiguration("csharp", {
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "<", close: ">" },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
        { open: "<", close: ">" },
      ],
      comments: {
        lineComment: "//",
        blockComment: ["/*", "*/"],
      },
    });

    // Add keyboard shortcut for Run (Ctrl/Cmd + Enter)
    editor.addAction({
      id: "run-code",
      label: "Run Code",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        onRun();
      },
    });

    // Add keyboard shortcut for Submit (Ctrl/Cmd + Shift + Enter)
    editor.addAction({
      id: "submit-code",
      label: "Submit Code",
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      ],
      run: () => {
        onSubmit();
      },
    });
  }, [onRun, onSubmit]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    const newCode = value || "";
    onCodeChange(newCode);

    // Trigger debounced diagnostics fetch
    debouncedFetchDiagnostics(newCode);
  }, [onCodeChange, debouncedFetchDiagnostics]);

  // Initial diagnostics fetch when code changes externally (e.g., lesson switch)
  useEffect(() => {
    if (isEditorReady && code) {
      debouncedFetchDiagnostics(code);
    }
  }, [code, isEditorReady, debouncedFetchDiagnostics]);

  // Initialize/destroy vim mode
  useEffect(() => {
    if (!isEditorReady || !editorRef.current || !statusBarRef.current) return;

    if (vimEnabled) {
      // Initialize vim mode
      vimModeRef.current = initVimMode(editorRef.current, statusBarRef.current);
    } else {
      // Dispose vim mode if it exists
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    }

    // Persist preference
    localStorage.setItem("editor-vim-mode", String(vimEnabled));

    return () => {
      if (vimModeRef.current) {
        vimModeRef.current.dispose();
        vimModeRef.current = null;
      }
    };
  }, [vimEnabled, isEditorReady]);

  const toggleVimMode = useCallback(() => {
    setVimEnabled((prev) => !prev);
  }, []);

  // Font size handlers
  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.min(prev + 2, MAX_FONT_SIZE);
      localStorage.setItem("editor-font-size", String(newSize));
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => {
      const newSize = Math.max(prev - 2, MIN_FONT_SIZE);
      localStorage.setItem("editor-font-size", String(newSize));
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  }, []);

  // Reset code to skeleton
  const handleReset = useCallback(() => {
    if (skeleton && code !== skeleton) {
      onCodeChange(skeleton);
    }
  }, [skeleton, code, onCodeChange]);

  const hasChanges = skeleton && code !== skeleton;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b bg-background">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-chart-2" />
          <span className="text-sm font-medium text-muted-foreground font-mono">
            Exercise.cs
          </span>
          {diagnosticsCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-destructive/20 text-destructive font-medium">
              {diagnosticsCount} {diagnosticsCount === 1 ? "error" : "errors"}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleVimMode}
                className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium transition-colors ${
                  vimEnabled
                    ? "bg-chart-5/20 text-chart-5"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                data-testid="button-toggle-vim"
              >
                VIM
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {vimEnabled ? "Disable Vim mode" : "Enable Vim mode"}
            </TooltipContent>
          </Tooltip>
          {/* Font size controls */}
          <div className="flex items-center gap-0.5 ml-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={decreaseFontSize}
                  disabled={fontSize <= MIN_FONT_SIZE}
                  className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-decrease-font"
                >
                  <Minus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Decrease font size</TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground font-mono w-6 text-center">{fontSize}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={increaseFontSize}
                  disabled={fontSize >= MAX_FONT_SIZE}
                  className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid="button-increase-font"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Increase font size</TooltipContent>
            </Tooltip>
          </div>
          {/* Reset button */}
          {hasChanges && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleReset}
                  className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                  data-testid="button-reset-code"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Reset to original code</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2">
          <KeyboardShortcutsModal />
          <ThemeToggle />
          <span className="text-xs text-muted-foreground hidden sm:block">
            Ctrl+Enter: Run | Ctrl+Shift+Enter: Submit
          </span>
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

      <div className="flex-1 relative min-h-0">
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
            fontSize: fontSize,
            lineHeight: Math.round(fontSize * 1.5),
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
            quickSuggestions: {
              other: true,
              comments: false,
              strings: false,
            },
            lineNumbers: "on",
            lineNumbersMinChars: 4,
            glyphMargin: true, // Enable for error markers
            folding: true,
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            // Enable hover for diagnostics
            hover: {
              enabled: true,
              delay: 300,
            },
          }}
        />
      </div>

      {/* Vim status bar - always rendered but hidden when vim is disabled */}
      <div
        ref={statusBarRef}
        className={`px-2 py-1 border-t bg-muted/50 text-xs font-mono text-muted-foreground ${
          vimEnabled ? "" : "hidden"
        }`}
      />
    </div>
  );
});
