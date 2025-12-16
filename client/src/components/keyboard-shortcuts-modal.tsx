import { Keyboard } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Code Execution",
    shortcuts: [
      { keys: ["Ctrl", "Enter"], description: "Run code" },
      { keys: ["Ctrl", "Shift", "Enter"], description: "Submit for grading" },
    ],
  },
  {
    title: "Editor",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save (auto-saved)" },
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
      { keys: ["Ctrl", "F"], description: "Find" },
      { keys: ["Ctrl", "H"], description: "Find and replace" },
      { keys: ["Ctrl", "/"], description: "Toggle line comment" },
      { keys: ["Ctrl", "D"], description: "Select next occurrence" },
      { keys: ["Alt", "Up/Down"], description: "Move line up/down" },
      { keys: ["Ctrl", "Shift", "K"], description: "Delete line" },
    ],
  },
  {
    title: "Vim Mode (when enabled)",
    shortcuts: [
      { keys: ["i"], description: "Insert mode" },
      { keys: ["Esc"], description: "Normal mode" },
      { keys: ["v"], description: "Visual mode" },
      { keys: [":w"], description: "Save" },
      { keys: [":q"], description: "Quit (no-op)" },
      { keys: ["dd"], description: "Delete line" },
      { keys: ["yy"], description: "Yank (copy) line" },
      { keys: ["p"], description: "Paste" },
      { keys: ["/"], description: "Search" },
    ],
  },
];

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center justify-center px-2 text-xs font-mono font-medium bg-muted border border-border rounded-none">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) {
          track("keyboard_shortcuts_opened");
        }
      }}
    >
      <Tooltip>
        <TooltipTrigger
          type="button"
          className={buttonVariants({
            variant: "ghost",
            size: "icon-sm",
            className: "h-7 w-7",
          })}
          onClick={() => setOpen(true)}
          data-testid="button-keyboard-shortcuts"
          aria-label="Open keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>Keyboard shortcuts</TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <KeyBadge>{key}</KeyBadge>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            On macOS, use <KeyBadge>Cmd</KeyBadge> instead of <KeyBadge>Ctrl</KeyBadge>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
