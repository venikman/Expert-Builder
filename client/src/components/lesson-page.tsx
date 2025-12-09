import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, Play, Terminal } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle, type ImperativePanelHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { LessonContent } from "@/components/lesson-content";
import { AnimationCanvas } from "@/components/animation-canvas";
import { CodeEditor } from "@/components/code-editor";
import { OutputPanel } from "@/components/output-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Lesson, LessonAnimation, ConsoleLine, SubmissionResult, ExecuteResult } from "@shared/schema";

interface LessonPageProps {
  lesson: Lesson | null;
  animation: LessonAnimation | null;
  isLoadingLesson: boolean;
  isLoadingAnimation: boolean;
}

export function LessonPage({
  lesson,
  animation,
  isLoadingLesson,
  isLoadingAnimation,
}: LessonPageProps) {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [testResult, setTestResult] = useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outputTab, setOutputTab] = useState<"console" | "tests">("console");
  const [mobileTab, setMobileTab] = useState<"lesson" | "canvas" | "editor">("lesson");
  const [isAnimationCollapsed, setIsAnimationCollapsed] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  
  const animationPanelRef = useRef<ImperativePanelHandle>(null);
  const outputPanelRef = useRef<ImperativePanelHandle>(null);
  
  const toggleAnimationPanel = useCallback(() => {
    if (isAnimationCollapsed) {
      animationPanelRef.current?.expand();
      setIsAnimationCollapsed(false);
    } else {
      animationPanelRef.current?.collapse();
      setIsAnimationCollapsed(true);
    }
  }, [isAnimationCollapsed]);
  
  const toggleOutputPanel = useCallback(() => {
    if (isOutputCollapsed) {
      outputPanelRef.current?.expand();
      setIsOutputCollapsed(false);
    } else {
      outputPanelRef.current?.collapse();
      setIsOutputCollapsed(true);
    }
  }, [isOutputCollapsed]);

  useEffect(() => {
    if (lesson?.skeleton) {
      setCode(lesson.skeleton);
      setConsoleLines([]);
      setTestResult(null);
    }
  }, [lesson?.id, lesson?.skeleton]);

  const addConsoleLine = useCallback((type: ConsoleLine["type"], content: string) => {
    setConsoleLines((prev) => [
      ...prev,
      { type, content, timestamp: Date.now() },
    ]);
  }, []);

  const handleRun = useCallback(async () => {
    if (!lesson) return;
    
    setIsRunning(true);
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
    } finally {
      setIsRunning(false);
    }
  }, [code, lesson, addConsoleLine]);

  const handleSubmit = useCallback(async () => {
    if (!lesson) return;
    
    setIsSubmitting(true);
    addConsoleLine("info", "Submitting for grading...");

    try {
      const result = await apiRequest<SubmissionResult>("POST", "/api/submit", {
        code,
        lessonId: lesson.id,
      });

      setTestResult(result);
      setOutputTab("tests");

      // Invalidate progress cache to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });

      if (result.success) {
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
    } finally {
      setIsSubmitting(false);
    }
  }, [code, lesson, addConsoleLine, toast]);

  const handleClearConsole = useCallback(() => {
    setConsoleLines([]);
  }, []);

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
          <ResizablePanel defaultSize={40} minSize={25}>
            <LessonContent lesson={lesson} />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col">
              {isAnimationCollapsed && (
                <button
                  onClick={toggleAnimationPanel}
                  className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30 hover-elevate text-sm text-muted-foreground"
                  data-testid="button-expand-animation"
                >
                  <span className="flex items-center gap-2">
                    <Play className="h-3 w-3" />
                    Animation
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
              
              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel 
                  ref={animationPanelRef}
                  defaultSize={isAnimationCollapsed ? 0 : 30} 
                  minSize={10} 
                  collapsible 
                  collapsedSize={0}
                  onCollapse={() => setIsAnimationCollapsed(true)}
                  onExpand={() => setIsAnimationCollapsed(false)}
                >
                  <AnimationCanvas
                    lessonId={lesson.id}
                    animation={animation}
                    isLoading={isLoadingAnimation}
                    isCollapsed={isAnimationCollapsed}
                    onToggleCollapse={toggleAnimationPanel}
                  />
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel defaultSize={50} minSize={20}>
                  <CodeEditor
                    code={code}
                    onCodeChange={setCode}
                    onRun={handleRun}
                    onSubmit={handleSubmit}
                    isRunning={isRunning}
                    isSubmitting={isSubmitting}
                  />
                </ResizablePanel>
                
                <ResizableHandle withHandle />
                
                <ResizablePanel 
                  ref={outputPanelRef}
                  defaultSize={isOutputCollapsed ? 0 : 20} 
                  minSize={10} 
                  collapsible 
                  collapsedSize={0}
                  onCollapse={() => setIsOutputCollapsed(true)}
                  onExpand={() => setIsOutputCollapsed(false)}
                >
                  <OutputPanel
                    consoleLines={consoleLines}
                    testResult={testResult}
                    onClearConsole={handleClearConsole}
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
                  className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/30 hover-elevate text-sm text-muted-foreground"
                  data-testid="button-expand-output"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    Console
                  </span>
                  <ChevronUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      <div className="lg:hidden h-full flex flex-col">
        <Tabs 
          value={mobileTab} 
          onValueChange={(v) => setMobileTab(v as "lesson" | "canvas" | "editor")}
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
                value="canvas"
                className="flex-1 data-[state=active]:bg-muted rounded-md"
                data-testid="mobile-tab-canvas"
              >
                Animation
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
          
          <TabsContent value="canvas" className="flex-1 m-0">
            <AnimationCanvas
              lessonId={lesson.id}
              animation={animation}
              isLoading={isLoadingAnimation}
            />
          </TabsContent>
          
          <TabsContent value="editor" className="flex-1 m-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <CodeEditor
                code={code}
                onCodeChange={setCode}
                onRun={handleRun}
                onSubmit={handleSubmit}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
              />
            </div>
            <div className="h-48 border-t">
              <OutputPanel
                consoleLines={consoleLines}
                testResult={testResult}
                onClearConsole={handleClearConsole}
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
