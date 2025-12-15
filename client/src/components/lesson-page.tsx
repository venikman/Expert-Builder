import { useState, useEffect, useRef, startTransition, useActionState } from "react";
import { ChevronDown, ChevronUp, Terminal, Clock } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle, type ImperativePanelHandle } from "@/components/ui/resizable";
import { LessonContent } from "@/components/lesson-content";
import { CodeEditor, type CodeEditorHandle } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { markLessonCompleted } from "@/lib/progress";
import type { Lesson, ConsoleLine, SubmissionResult, ExecuteResult, Diagnostic } from "@shared/schema";

interface LessonPageProps {
  lesson: Lesson | null;
  isLoadingLesson: boolean;
}

export function LessonPage({
  lesson,
  isLoadingLesson,
}: LessonPageProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [testResult, setTestResult] = useState<SubmissionResult | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [outputTab, setOutputTab] = useState<"console" | "tests" | "problems">("problems");
  const [mobileTab, setMobileTab] = useState<"lesson" | "editor">("lesson");
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);

  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<Timer>(undefined);

  const outputPanelRef = useRef<ImperativePanelHandle>(null);
  const codeEditorRef = useRef<CodeEditorHandle>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleOutputPanel = () => {
    if (isOutputCollapsed) {
      outputPanelRef.current?.expand();
      setIsOutputCollapsed(false);
    } else {
      outputPanelRef.current?.collapse();
      setIsOutputCollapsed(true);
    }
  };

  // Load code from localStorage or skeleton, and start timer
  useEffect(() => {
    if (lesson?.id && lesson?.skeleton) {
      // Try to restore saved code
      const savedCode = localStorage.getItem(`code-${lesson.id}`);
      const savedTime = localStorage.getItem(`time-${lesson.id}`);

      if (savedCode && savedCode !== lesson.skeleton) {
        setCode(savedCode);
      } else {
        setCode(lesson.skeleton);
      }

      // Restore or reset timer
      setElapsedTime(savedTime ? parseInt(savedTime, 10) : 0);

      setConsoleLines([]);
      setTestResult(null);
      setDiagnostics([]);

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          const newTime = prev + 1;
          localStorage.setItem(`time-${lesson.id}`, String(newTime));
          return newTime;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [lesson?.id, lesson?.skeleton]);

  // Auto-save code to localStorage
  useEffect(() => {
    if (lesson?.id && code) {
      localStorage.setItem(`code-${lesson.id}`, code);
    }
  }, [code, lesson?.id]);

  const handleDiagnosticClick = (diagnostic: Diagnostic) => {
    codeEditorRef.current?.goToLine(diagnostic.line, diagnostic.column);
  };

  const addConsoleLine = (type: ConsoleLine["type"], content: string) => {
    setConsoleLines((prev) => [
      ...prev,
      { type, content, timestamp: Date.now() },
    ]);
  };

  const [_runState, runAction, isRunning] = useActionState(
    async (prevState: null) => {
      if (!lesson) return prevState;

      setOutputTab("console");
      addConsoleLine("info", "Compiling and running...");

      try {
        const result = await apiRequest<ExecuteResult>("POST", "/api/execute", {
          code,
          lessonId: lesson.id,
        });

        if (result.success) {
          if (result.output) {
            result.output.split("\n").forEach((line: string) => {
              if (line.trim()) {
                addConsoleLine("stdout", line);
              }
            });
          }
          addConsoleLine("info", `Execution completed in ${result.executionTime || 0}ms`);
        } else {
          if (result.error) {
            addConsoleLine("stderr", result.error);
          }
          addConsoleLine("info", "Execution failed");
        }
      } catch (error) {
        addConsoleLine("stderr", error instanceof Error ? error.message : "Unknown error");
      }

      return prevState;
    },
    null
  );

  const handleRun = () => {
    startTransition(() => {
      runAction();
    });
  };

  const [_submitState, submitAction, isSubmitting] = useActionState(
    async (prevState: null) => {
      if (!lesson) return prevState;

      addConsoleLine("info", "Submitting for grading...");

      try {
        const result = await apiRequest<SubmissionResult>("POST", "/api/submit", {
          code,
          lessonId: lesson.id,
        });

        setTestResult(result);
        setOutputTab("tests");

        if (result.success) {
          const updatedProgress = markLessonCompleted(lesson.id);
          queryClient.setQueryData(["lesson-progress"], updatedProgress);
          toast({
            title: "All tests passed!",
            description: "Great job! You can move on to the next lesson.",
          });
        } else {
          toast({
            title: "Some tests failed",
            description: `${result.passedTests}/${result.totalTests} tests passed. Check the results for details.`,
            variant: "destructive",
          });
        }
      } catch (error) {
        addConsoleLine("stderr", error instanceof Error ? error.message : "Submission failed");
        toast({
          title: "Submission failed",
          description: "There was an error grading your code. Please try again.",
          variant: "destructive",
        });
      }

      return prevState;
    },
    null
  );

  const handleSubmit = () => {
    startTransition(() => {
      submitAction();
    });
  };

  const handleClearConsole = () => {
    setConsoleLines([]);
  };

  if (isLoadingLesson || !lesson) {
    return (
      <div className="h-full p-6 space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:flex h-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={40} minSize={20}>
            <div className="h-full min-w-[320px]">
              <LessonContent lesson={lesson} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={60} minSize={30}>
            <div className="h-full flex flex-col min-w-[480px]">
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={70} minSize={30}>
                  <CodeEditor
                    ref={codeEditorRef}
                    code={code}
                    lessonId={lesson.id}
                    skeleton={lesson.skeleton}
                    onCodeChange={setCode}
                    onRun={handleRun}
                    onSubmit={handleSubmit}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                    onDiagnosticsChange={setDiagnostics}
                  />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel
                  ref={outputPanelRef}
                  defaultSize={isOutputCollapsed ? 0 : 30}
                  minSize={10}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => setIsOutputCollapsed(true)}
                  onExpand={() => setIsOutputCollapsed(false)}
                >
                  <OutputPanel
                    consoleLines={consoleLines}
                    testResult={testResult}
                    diagnostics={diagnostics}
                    onClearConsole={handleClearConsole}
                    onDiagnosticClick={handleDiagnosticClick}
                    activeTab={outputTab}
                    onTabChange={setOutputTab}
                    isCollapsed={isOutputCollapsed}
                    onToggleCollapse={toggleOutputPanel}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>

              {isOutputCollapsed && (
                <button
                  onClick={toggleOutputPanel}
                  aria-label="Expand console panel"
                  aria-expanded={!isOutputCollapsed}
                  className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/30 hover-elevate text-sm text-muted-foreground"
                  data-testid="button-expand-output"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    Console
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-xs font-mono">
                      <Clock className="h-3 w-3" />
                      {formatTime(elapsedTime)}
                    </span>
                    <ChevronUp className="h-4 w-4" />
                  </div>
                </button>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="lg:hidden h-full flex flex-col">
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as "lesson" | "editor")}
          className="flex-1 flex flex-col"
        >
          <div className="border-b px-2 shrink-0">
            <TabsList className="h-12 w-full bg-transparent">
              <TabsTrigger
                value="lesson"
                className="flex-1 data-[state=active]:bg-muted rounded-md"
                data-testid="mobile-tab-lesson"
              >
                Lesson
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className="flex-1 data-[state=active]:bg-muted rounded-md"
                data-testid="mobile-tab-editor"
              >
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lesson" className="flex-1 m-0">
            <LessonContent lesson={lesson} />
          </TabsContent>

          <TabsContent value="editor" className="flex-1 m-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <CodeEditor
                ref={codeEditorRef}
                code={code}
                lessonId={lesson.id}
                skeleton={lesson.skeleton}
                onCodeChange={setCode}
                onRun={handleRun}
                onSubmit={handleSubmit}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                onDiagnosticsChange={setDiagnostics}
              />
            </div>
            <div className="h-48 border-t">
              <OutputPanel
                consoleLines={consoleLines}
                testResult={testResult}
                diagnostics={diagnostics}
                onClearConsole={handleClearConsole}
                onDiagnosticClick={handleDiagnosticClick}
                activeTab={outputTab}
                onTabChange={setOutputTab}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
