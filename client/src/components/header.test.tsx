import { test, expect } from "bun:test";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, act } from "react";
import { Header } from "./header";
import { ThemeProvider } from "@/components/theme-provider";

const lessons: any[] = [
  {
    id: "1",
    title: "Lesson 1",
    conceptTags: [],
    description: "",
    skeleton: "",
    referenceSolution: "",
    testCode: "",
    hints: {},
    order: 1,
  },
  {
    id: "2",
    title: "Lesson 2",
    conceptTags: [],
    description: "",
    skeleton: "",
    referenceSolution: "",
    testCode: "",
    hints: {},
    order: 2,
  },
];

async function renderHeader(progress: unknown) {
  localStorage.setItem("lesson-progress", JSON.stringify(progress));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  let rendered!: ReturnType<typeof render>;
  await act(async () => {
    rendered = render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={null}>
            <Header
              lessons={lessons as any}
              currentLessonIndex={0}
              onLessonChange={() => {}}
            />
          </Suspense>
        </QueryClientProvider>
      </ThemeProvider>
    );
  });
  return rendered;
}

test("shows progress count based on stored completions", async () => {
  const { findAllByText } = await renderHeader({ "1": { completed: true, completedAt: 1 } });

  const matches = await findAllByText("1/2");
  expect(matches.length).toBeGreaterThanOrEqual(2);
});
