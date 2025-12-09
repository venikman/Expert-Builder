import OpenAI from "openai";

// Lazy-initialized OpenAI client for OpenRouter API
let openaiClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!process.env.OPENROUTER_KEY) {
    return null;
  }
  
  if (!openaiClient) {
    // Using OpenRouter API with OpenAI SDK compatibility
    // OpenRouter provides access to multiple AI models through a single API
    openaiClient = new OpenAI({
      apiKey: process.env.OPENROUTER_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://fp-csharp-academy.replit.app",
        "X-Title": "FP C# Academy"
      }
    });
  }
  
  return openaiClient;
}

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
  const { lessonId, lessonTitle, code, failedTests, staticHint } = context;

  const client = getClient();
  if (!client) {
    return staticHint || "Check your solution and try again.";
  }

  const failedTestsDescription = failedTests
    .map(t => `- ${t.name}${t.message ? `: ${t.message}` : ""}`)
    .join("\n");

  const systemPrompt = `You are an expert C# tutor specializing in functional programming concepts. Your role is to help learners understand their mistakes without giving away the answer directly.

Guidelines:
- Be encouraging and supportive
- Point to the specific concept they might be misunderstanding
- Give a hint that guides them toward the solution without writing the code for them
- Reference the specific test that failed and what it's checking
- Keep your response concise (2-4 sentences)
- Use simple language appropriate for someone learning functional programming`;

  const userPrompt = `A learner is working on the lesson "${lessonTitle}" (${lessonId}).

Their submitted code:
\`\`\`csharp
${code}
\`\`\`

The following tests failed:
${failedTestsDescription}

${staticHint ? `The original hint for this lesson was: "${staticHint}"` : ""}

Provide a personalized hint to help them understand what went wrong and guide them toward the correct solution.`;

  try {
    const response = await client.chat.completions.create({
      model: "anthropic/claude-3.5-sonnet", // Good balance of quality and cost
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
    });

    const aiHint = response.choices[0]?.message?.content;
    
    if (aiHint && aiHint.trim()) {
      return aiHint.trim();
    }
    
    return staticHint || "Review your code and consider the functional programming principles covered in this lesson.";
  } catch (error) {
    console.error("AI tutor error:", error);
    return staticHint || "Check your solution and try again.";
  }
}
