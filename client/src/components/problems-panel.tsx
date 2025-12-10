import { AlertCircle, AlertTriangle, Info, FileCode2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Diagnostic } from "@shared/schema";
import { isCodeError } from "@shared/schema";

interface ProblemsPanelProps {
  diagnostics: Diagnostic[];
  onDiagnosticClick?: (diagnostic: Diagnostic) => void;
}

export function ProblemsPanel({ diagnostics: rawDiagnostics, onDiagnosticClick }: ProblemsPanelProps) {
  // Filter out infrastructure errors
  const diagnostics = rawDiagnostics.filter(isCodeError);

  const errors = diagnostics.filter((d) => d.severity === "error");
  const warnings = diagnostics.filter((d) => d.severity === "warning");
  const infos = diagnostics.filter((d) => d.severity === "info");

  const getSeverityIcon = (severity: Diagnostic["severity"]) => {
    switch (severity) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive shrink-0" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  if (diagnostics.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
        <FileCode2 className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No problems detected</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-0.5">
        <div className="flex items-center gap-3 px-2 py-1 text-xs text-muted-foreground border-b mb-1">
          {errors.length > 0 && (
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-destructive" />
              {errors.length} {errors.length === 1 ? "Error" : "Errors"}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              {warnings.length} {warnings.length === 1 ? "Warning" : "Warnings"}
            </span>
          )}
          {infos.length > 0 && (
            <span className="flex items-center gap-1">
              <Info className="h-3 w-3 text-blue-500" />
              {infos.length} {infos.length === 1 ? "Info" : "Infos"}
            </span>
          )}
        </div>
        {diagnostics.map((diagnostic, index) => (
          <button
            key={`${diagnostic.line}-${diagnostic.column}-${index}`}
            onClick={() => onDiagnosticClick?.(diagnostic)}
            className="w-full flex items-start gap-2 px-2 py-1.5 rounded text-left hover:bg-muted/50 transition-colors group"
          >
            {getSeverityIcon(diagnostic.severity)}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{diagnostic.message}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">Exercise.cs</span>
                <span className="mx-1">:</span>
                <span className="font-mono">{diagnostic.line}:{diagnostic.column}</span>
                {diagnostic.code && (
                  <span className="ml-2 opacity-70">[{diagnostic.code}]</span>
                )}
              </p>
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}
