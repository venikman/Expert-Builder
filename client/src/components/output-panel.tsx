import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConsoleOutput } from "@/components/console-output";
import { TestResults } from "@/components/test-results";
import { ProblemsPanel } from "@/components/problems-panel";
import type { ConsoleLine, SubmissionResult, Diagnostic } from "@shared/schema";

// Infrastructure error codes to filter out (build system noise, not actual code errors)
const INFRASTRUCTURE_ERROR_CODES = new Set([
  "NETSDK1004", "NETSDK1045", "MSB4236",
  "NU1100", "NU1101", "NU1102", "NU1103",
]);

function isCodeError(d: Diagnostic): boolean {
  if (d.code && INFRASTRUCTURE_ERROR_CODES.has(d.code)) return false;
  if (d.message.includes("Assets file") || d.message.includes("NuGet package restore")) return false;
  return true;
}

interface OutputPanelProps {
  consoleLines: ConsoleLine[];
  testResult: SubmissionResult | null;
  diagnostics: Diagnostic[];
  lessonId?: string;
  onClearConsole: () => void;
  onDiagnosticClick?: (diagnostic: Diagnostic) => void;
  activeTab: "console" | "tests" | "problems";
  onTabChange: (tab: "console" | "tests" | "problems") => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function OutputPanel({
  consoleLines,
  testResult,
  diagnostics: rawDiagnostics,
  lessonId,
  onClearConsole,
  onDiagnosticClick,
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}: OutputPanelProps) {
  // Filter out infrastructure errors for count
  const diagnostics = rawDiagnostics.filter(isCodeError);
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;

  return (
    <div className="h-full flex flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as "console" | "tests" | "problems")}
        className="h-full flex flex-col"
      >
        <div className="border-b px-2 flex items-center justify-between">
          <TabsList className="h-8 bg-transparent gap-1">
            <TabsTrigger
              value="problems"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm relative"
              data-testid="tab-problems"
            >
              Problems
              {(errorCount > 0 || warningCount > 0) && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    errorCount > 0
                      ? "bg-destructive/20 text-destructive"
                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {errorCount > 0 ? errorCount : warningCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="console"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm"
              data-testid="tab-console"
            >
              Console
            </TabsTrigger>
            <TabsTrigger
              value="tests"
              className="data-[state=active]:bg-muted rounded-md px-3 py-1.5 text-sm relative"
              data-testid="tab-tests"
            >
              Tests
              {testResult && (
                <span
                  className={`ml-1.5 inline-flex items-center justify-center text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    testResult.passedTests === testResult.totalTests
                      ? "bg-chart-5/20 text-chart-5"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {testResult.passedTests}/{testResult.totalTests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          {onToggleCollapse && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  data-testid="button-toggle-output"
                >
                  {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isCollapsed ? "Expand" : "Collapse"}</TooltipContent>
            </Tooltip>
          )}
        </div>
        <TabsContent value="problems" className="flex-1 m-0 h-0">
          <ProblemsPanel diagnostics={diagnostics} onDiagnosticClick={onDiagnosticClick} />
        </TabsContent>
        <TabsContent value="console" className="flex-1 m-0 h-0">
          <ConsoleOutput lines={consoleLines} onClear={onClearConsole} />
        </TabsContent>
        <TabsContent value="tests" className="flex-1 m-0 h-0">
          <TestResults result={testResult} lessonId={lessonId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
