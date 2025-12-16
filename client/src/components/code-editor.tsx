import { useState, useCallback, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import Editor, { OnMount, BeforeMount, Monaco } from "@monaco-editor/react";
import { initVimMode } from "monaco-vim";
import { Play, Send, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { registerCSharpCompletions } from "@/lib/csharp-completions";
import { apiRequest } from "@/lib/queryClient";
import { track } from "@/lib/analytics";
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
  const timeoutRef = useRef<Timer>(undefined);

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
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [diagnosticsCount, setDiagnosticsCount] = useState(0);
  const previousDiagnosticsCountRef = useRef<number | null>(null);
  const lessonIdRef = useRef<string | undefined>(lessonId);
  const onRunRef = useRef(onRun);
  const onSubmitRef = useRef(onSubmit);

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

  useEffect(() => {
    lessonIdRef.current = lessonId;
  }, [lessonId]);

  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

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

  // Define custom themes before editor mounts - Cursor IDE inspired
  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monaco.editor.defineTheme("app-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        // Cursor-inspired syntax highlighting for C#
        // Keywords: using, class, public, private, static, void, if, else, etc.
        { token: "keyword", foreground: "AAA0FA" },              // lavender
        { token: "keyword.cs", foreground: "AAA0FA" },
        { token: "keyword.flow.cs", foreground: "AAA0FA" },
        // Strings
        { token: "string", foreground: "83D6C5" },               // teal
        { token: "string.cs", foreground: "83D6C5" },
        { token: "string.escape", foreground: "EFB080" },        // amber for escapes
        { token: "string.escape.cs", foreground: "EFB080" },
        // Numbers
        { token: "number", foreground: "EFB080" },               // amber
        { token: "number.cs", foreground: "EFB080" },
        { token: "number.float", foreground: "EFB080" },
        { token: "number.hex", foreground: "EFB080" },
        // Comments
        { token: "comment", foreground: "6B6B6B", fontStyle: "italic" },
        { token: "comment.cs", foreground: "6B6B6B", fontStyle: "italic" },
        { token: "comment.doc", foreground: "6B8B6B", fontStyle: "italic" },
        // Types and classes
        { token: "type", foreground: "87C3FF" },                 // blue
        { token: "type.cs", foreground: "87C3FF" },
        { token: "type.identifier", foreground: "87C3FF" },
        { token: "type.identifier.cs", foreground: "87C3FF" },
        { token: "class", foreground: "87C3FF" },
        { token: "class.cs", foreground: "87C3FF" },
        { token: "struct", foreground: "87C3FF" },
        { token: "interface", foreground: "82D2CE" },            // mint for interfaces
        { token: "enum", foreground: "87C3FF" },
        // Identifiers and variables
        { token: "identifier", foreground: "E4E4E4" },
        { token: "identifier.cs", foreground: "E4E4E4" },
        { token: "variable", foreground: "E4E4E4" },
        // Delimiters and operators
        { token: "delimiter", foreground: "A0A0A0" },
        { token: "delimiter.cs", foreground: "A0A0A0" },
        { token: "delimiter.bracket", foreground: "A0A0A0" },
        { token: "delimiter.parenthesis", foreground: "A0A0A0" },
        { token: "delimiter.curly", foreground: "A0A0A0" },
        { token: "delimiter.square", foreground: "A0A0A0" },
        { token: "delimiter.angle", foreground: "87C3FF" },      // generics
        { token: "operator", foreground: "C1808A" },             // rose
        { token: "operator.cs", foreground: "C1808A" },
        // Namespace
        { token: "namespace", foreground: "82D2CE" },            // mint
        { token: "namespace.cs", foreground: "82D2CE" },
        // Methods
        { token: "entity.name.function", foreground: "82D2CE" },
        { token: "metatag", foreground: "AAA0FA" },              // attributes
        { token: "annotation", foreground: "AAA0FA" },
      ],
      colors: {
        // Near-black backgrounds - Cursor style
        "editor.background": "#0a0a0a",
        "editor.foreground": "#e4e4e4",
        "editor.lineHighlightBackground": "#151515",
        "editorLineNumber.foreground": "#404040",
        "editorLineNumber.activeForeground": "#707070",
        // Teal selection and cursor - Cursor accent
        "editor.selectionBackground": "#83D6C535",
        "editor.selectionHighlightBackground": "#83D6C520",
        "editor.wordHighlightBackground": "#83D6C520",
        "editor.wordHighlightStrongBackground": "#83D6C530",
        "editorCursor.foreground": "#83D6C5",
        "editorCursor.background": "#0a0a0a",
        // Gutter and widgets
        "editorGutter.background": "#0a0a0a",
        "editorWidget.background": "#121212",
        "editorWidget.border": "#252525",
        "editorSuggestWidget.background": "#121212",
        "editorSuggestWidget.border": "#252525",
        "editorSuggestWidget.foreground": "#e4e4e4",
        "editorSuggestWidget.selectedBackground": "#83D6C525",
        "editorSuggestWidget.highlightForeground": "#83D6C5",
        "editorHoverWidget.background": "#121212",
        "editorHoverWidget.border": "#252525",
        // Bracket matching with teal
        "editorBracketMatch.background": "#83D6C530",
        "editorBracketMatch.border": "#83D6C560",
        // Bracket pair colorization
        "editorBracketHighlight.foreground1": "#83D6C5",
        "editorBracketHighlight.foreground2": "#AAA0FA",
        "editorBracketHighlight.foreground3": "#EFB080",
        "editorBracketHighlight.foreground4": "#87C3FF",
        // Find/search
        "editor.findMatchBackground": "#EFB08050",
        "editor.findMatchHighlightBackground": "#EFB08030",
        "editor.findMatchBorder": "#EFB080",
        // Indent guides
        "editorIndentGuide.background": "#252525",
        "editorIndentGuide.activeBackground": "#404040",
        // Scrollbar
        "scrollbarSlider.background": "#ffffff12",
        "scrollbarSlider.hoverBackground": "#ffffff20",
        "scrollbarSlider.activeBackground": "#ffffff30",
        // Minimap
        "minimap.background": "#0a0a0a",
      },
    });

    monaco.editor.defineTheme("app-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "7C3AED" },              // purple
        { token: "keyword.cs", foreground: "7C3AED" },
        { token: "string", foreground: "0D9488" },               // teal
        { token: "string.cs", foreground: "0D9488" },
        { token: "number", foreground: "D97706" },               // amber
        { token: "number.cs", foreground: "D97706" },
        { token: "comment", foreground: "6B7280", fontStyle: "italic" },
        { token: "comment.cs", foreground: "6B7280", fontStyle: "italic" },
        { token: "type", foreground: "2563EB" },                 // blue
        { token: "type.cs", foreground: "2563EB" },
        { token: "type.identifier", foreground: "2563EB" },
        { token: "namespace", foreground: "059669" },            // mint
        { token: "delimiter", foreground: "374151" },
        { token: "operator", foreground: "BE185D" },             // rose
      ],
      colors: {
        "editor.background": "#fafafa",
        "editor.foreground": "#1f2937",
        "editor.lineHighlightBackground": "#f3f4f6",
        "editor.selectionBackground": "#83D6C545",
        "editorCursor.foreground": "#0D9488",
        "editorBracketMatch.background": "#83D6C540",
        "editorBracketMatch.border": "#83D6C5",
        "editorBracketHighlight.foreground1": "#0D9488",
        "editorBracketHighlight.foreground2": "#7C3AED",
        "editorBracketHighlight.foreground3": "#D97706",
      },
    });
  }, []);

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
        track("code_run_initiated", { source: "keyboard", lesson_id: lessonIdRef.current });
        onRunRef.current();
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
        track("code_submit_initiated", { source: "keyboard", lesson_id: lessonIdRef.current });
        onSubmitRef.current();
      },
    });
  }, []);

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

  const toggleVimMode = () => {
    setVimEnabled((prev) => {
      const next = !prev;
      track("editor_vim_toggled", { enabled: next, lesson_id: lessonId });
      return next;
    });
  };

  // Font size handlers
  const increaseFontSize = () => {
    setFontSize((prev) => {
      const newSize = Math.min(prev + 2, MAX_FONT_SIZE);
      if (newSize !== prev) {
        track("editor_font_size_changed", {
          direction: "increase",
          font_size: newSize,
          lesson_id: lessonId,
        });
      }
      localStorage.setItem("editor-font-size", String(newSize));
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => {
      const newSize = Math.max(prev - 2, MIN_FONT_SIZE);
      if (newSize !== prev) {
        track("editor_font_size_changed", {
          direction: "decrease",
          font_size: newSize,
          lesson_id: lessonId,
        });
      }
      localStorage.setItem("editor-font-size", String(newSize));
      editorRef.current?.updateOptions({ fontSize: newSize });
      return newSize;
    });
  };

  // Reset code to skeleton
  const handleReset = () => {
    if (skeleton && code !== skeleton) {
      track("code_reset", { lesson_id: lessonId });
      onCodeChange(skeleton);
    }
  };

  const hasChanges = skeleton && code !== skeleton;

  useEffect(() => {
    if (!lessonId) return;

    const previous = previousDiagnosticsCountRef.current;
    if (previous === null) {
      previousDiagnosticsCountRef.current = diagnosticsCount;
      return;
    }

    if (previous === 0 && diagnosticsCount > 0) {
      track("diagnostics_errors_present", { lesson_id: lessonId, error_count: diagnosticsCount });
    } else if (previous > 0 && diagnosticsCount === 0) {
      track("diagnostics_errors_cleared", { lesson_id: lessonId });
    }

    previousDiagnosticsCountRef.current = diagnosticsCount;
  }, [diagnosticsCount, lessonId]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between h-12 px-4 border-b bg-background">
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
            <TooltipTrigger
              type="button"
              onClick={toggleVimMode}
              aria-label={vimEnabled ? "Disable Vim mode" : "Enable Vim mode"}
              aria-pressed={vimEnabled}
              className={`text-xs px-1.5 py-0.5 rounded font-mono font-medium transition-colors ${
                vimEnabled
                  ? "bg-chart-5/20 text-chart-5"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid="button-toggle-vim"
            >
              VIM
            </TooltipTrigger>
            <TooltipContent>
              {vimEnabled ? "Disable Vim mode" : "Enable Vim mode"}
            </TooltipContent>
          </Tooltip>
          {/* Font size controls */}
          <div className="flex items-center gap-0.5 ml-1">
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={decreaseFontSize}
                disabled={fontSize <= MIN_FONT_SIZE}
                aria-label="Decrease font size"
                className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="button-decrease-font"
              >
                <Minus className="h-3 w-3" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Decrease font size</TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground font-mono w-6 text-center">{fontSize}</span>
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={increaseFontSize}
                disabled={fontSize >= MAX_FONT_SIZE}
                aria-label="Increase font size"
                className="p-1 rounded text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                data-testid="button-increase-font"
              >
                <Plus className="h-3 w-3" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Increase font size</TooltipContent>
            </Tooltip>
          </div>
          {/* Reset button */}
          {hasChanges && (
            <Tooltip>
              <TooltipTrigger
                type="button"
                onClick={handleReset}
                aria-label="Reset to original code"
                className="p-1 rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                data-testid="button-reset-code"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Reset to original code</TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2">
          <KeyboardShortcutsModal />
          <span className="text-xs text-muted-foreground hidden sm:block">
            Ctrl+Enter: Run | Ctrl+Shift+Enter: Submit
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              track("code_run_initiated", { source: "button", lesson_id: lessonId });
              onRun();
            }}
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
            onClick={() => {
              track("code_submit_initiated", { source: "button", lesson_id: lessonId });
              onSubmit();
            }}
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
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          theme="app-dark"
          options={{
            minimap: { enabled: false },
            fontSize: fontSize,
            lineHeight: Math.round(fontSize * 1.5),
            fontFamily: "'Monaspace Argon', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
