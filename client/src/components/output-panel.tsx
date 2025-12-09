import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConsoleOutput } from "@/components/console-output";
import { TestResults } from "@/components/test-results";
import type { ConsoleLine, SubmissionResult } from "@shared/schema";

interface OutputPanelProps {
  consoleLines: ConsoleLine[];
  testResult: SubmissionResult | null;
  onClearConsole: () => void;
  activeTab: "console" | "tests";
  onTabChange: (tab: "console" | "tests") => void;
}

export function OutputPanel({
  consoleLines,
  testResult,
  onClearConsole,
  activeTab,
  onTabChange,
}: OutputPanelProps) {
  return (
    <div className="h-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => onTabChange(v as "console" | "tests")}
        className="h-full flex flex-col"
      >
        <div className="border-b px-2">
          <TabsList className="h-10 bg-transparent gap-1">
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
        </div>
        <TabsContent value="console" className="flex-1 m-0 h-0">
          <ConsoleOutput lines={consoleLines} onClear={onClearConsole} />
        </TabsContent>
        <TabsContent value="tests" className="flex-1 m-0 h-0">
          <TestResults result={testResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
