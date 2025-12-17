import { CheckCircle2, XCircle, AlertCircle, Lightbulb, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { buttonVariants } from "@/components/ui/button";
import type { SubmissionResult } from "@shared/schema";
import { useState } from "react";

interface TestResultsProps {
  result: SubmissionResult | null;
}

export function TestResults({ result }: TestResultsProps) {
  const [isHintOpen, setIsHintOpen] = useState(false);

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
              <CollapsibleTrigger
                type="button"
                className={buttonVariants({
                  variant: "ghost",
                  className: "w-fit justify-start gap-2 text-chart-3",
                })}
                data-testid="button-toggle-hint"
              >
                <Lightbulb className="h-4 w-4" />
                {isHintOpen ? "Hide Hint" : "Show Hint"}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-chart-3/10 border border-chart-3/20 rounded-none p-4 mt-2">
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
