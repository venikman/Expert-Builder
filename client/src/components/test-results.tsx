import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Trophy, Eye, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import type { SubmissionResult } from "@shared/schema";
import { useState, useCallback } from "react";

interface TestResultsProps {
  result: SubmissionResult | null;
  lessonId?: string;
}

export function TestResults({ result, lessonId }: TestResultsProps) {
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [solutionDialogOpen, setSolutionDialogOpen] = useState(false);

  const fetchSolution = useCallback(async () => {
    if (!lessonId || solution) return;
    setIsLoadingSolution(true);
    try {
      const response = await apiRequest<{ solution: string }>("GET", `/api/lessons/${lessonId}/solution`);
      setSolution(response.solution);
    } catch {
      // Silently fail - user might not have completed the lesson
    } finally {
      setIsLoadingSolution(false);
    }
  }, [lessonId, solution]);

  if (!result) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b bg-background">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Test Results</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Submit your code to run tests
            </p>
          </div>
        </div>
      </div>
    );
  }

  const allPassed = result.passedTests === result.totalTests;
  const failedTests = result.results.filter(t => !t.passed);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex items-center gap-2">
          {allPassed ? (
            <CheckCircle2 className="h-4 w-4 text-chart-5" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
          <span className="text-sm font-medium text-muted-foreground">Test Results</span>
        </div>
        <Badge
          variant={allPassed ? "default" : "secondary"}
          className={allPassed ? "bg-chart-5 text-white" : ""}
          data-testid="badge-test-summary"
        >
          {result.passedTests}/{result.totalTests} passed
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {allPassed && (
            <div className="bg-chart-5/10 border border-chart-5/20 rounded-lg p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-chart-5" />
              <p className="font-medium text-chart-5">All tests passed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Great work! Move on to the next lesson.
              </p>
              {lessonId && (
                <Dialog open={solutionDialogOpen} onOpenChange={(open) => {
                  setSolutionDialogOpen(open);
                  if (open) fetchSolution();
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      data-testid="button-view-solution"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Reference Solution
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Reference Solution</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh]">
                      {isLoadingSolution ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : solution ? (
                        <pre className="bg-muted p-4 rounded-md text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                          {solution}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          Solution not available
                        </p>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          <div className="space-y-2">
            {result.results.map((test, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-md border ${
                  test.passed
                    ? "bg-chart-5/5 border-chart-5/20"
                    : "bg-destructive/5 border-destructive/20"
                }`}
                data-testid={`test-result-${index}`}
              >
                {test.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-chart-5 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" data-testid={`test-name-${index}`}>
                    {test.name}
                  </p>
                  {test.message && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      {test.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {result.hint && failedTests.length > 0 && (
            <Collapsible open={isHintOpen} onOpenChange={setIsHintOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-chart-3"
                  data-testid="button-toggle-hint"
                >
                  <Lightbulb className="h-4 w-4" />
                  {isHintOpen ? "Hide Hint" : "Show Hint"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-chart-3/10 border border-chart-3/20 rounded-md p-4 mt-2">
                  <p className="text-sm text-foreground">{result.hint}</p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
