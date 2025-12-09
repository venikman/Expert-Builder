interface TestFailure {
  name: string;
  message?: string;
}

interface TutorContext {
  lessonId: string;
  lessonTitle: string;
  code: string;
  failedTests: TestFailure[];
  staticHint?: string;
}

export async function generatePersonalizedHint(context: TutorContext): Promise<string> {
  const { staticHint } = context;

  // Return static hint or default message
  return staticHint || "Check your solution and try again.";
}
