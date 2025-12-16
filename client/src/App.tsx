import { Switch, Route } from "wouter";
import { Component, Suspense, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home, { HomeSkeleton } from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-screen flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            Something went wrong loading the app.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppErrorBoundary>
          <Suspense fallback={<HomeSkeleton />}>
            <Router />
          </Suspense>
        </AppErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
