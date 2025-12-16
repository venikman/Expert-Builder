type JsonObject = Record<string, unknown>;

type InsightQuery = {
  kind: "InsightVizNode";
  source: JsonObject;
};

const apiHost = (process.env.POSTHOG_API_HOST || "https://app.posthog.com").replace(/\/$/, "");
const projectId = process.env.POSTHOG_PROJECT_ID;
const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

if (!projectId || !personalApiKey) {
  console.error(
    [
      "Missing PostHog env vars:",
      `- POSTHOG_PROJECT_ID: ${projectId ? "set" : "missing"}`,
      `- POSTHOG_PERSONAL_API_KEY: ${personalApiKey ? "set" : "missing"}`,
      "",
      "Create a Personal API key in PostHog and grant scopes: dashboard:write, insight:write",
      "Then run: POSTHOG_PROJECT_ID=... POSTHOG_PERSONAL_API_KEY=... bun run posthog:dashboards",
    ].join("\n")
  );
  process.exit(1);
}

const authHeaders: HeadersInit = {
  Authorization: `Bearer ${personalApiKey}`,
  "Content-Type": "application/json",
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiHost}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PostHog API ${res.status} ${res.statusText}: ${body}`);
  }

  return (await res.json()) as T;
}

type DashboardListResponse = {
  results: Array<{ id: number; name: string }>;
};

type InsightListResponse = {
  results: Array<{ id: number; name: string; dashboards?: number[] }>;
};

async function ensureDashboard(name: string, description: string): Promise<number> {
  const dashboards = await api<DashboardListResponse>(`/api/projects/${projectId}/dashboards/?limit=200`);
  const existing = dashboards.results.find((d) => d.name === name);
  if (existing) return existing.id;

  const created = await api<{ id: number }>(`/api/projects/${projectId}/dashboards/`, {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
  return created.id;
}

async function listInsights(): Promise<InsightListResponse["results"]> {
  const insights = await api<InsightListResponse>(`/api/projects/${projectId}/insights/?limit=200`);
  return insights.results;
}

async function ensureInsight(params: {
  name: string;
  dashboardId: number;
  query: InsightQuery;
  description?: string;
}): Promise<number> {
  const { name, dashboardId, query, description = "" } = params;
  const insights = await listInsights();
  const existing = insights.find((i) => i.name === name);

  if (!existing) {
    const created = await api<{ id: number }>(`/api/projects/${projectId}/insights/`, {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        saved: true,
        dashboards: [dashboardId],
        query,
      }),
    });
    return created.id;
  }

  const dashboards = new Set<number>(existing.dashboards || []);
  dashboards.add(dashboardId);

  const updated = await api<{ id: number }>(`/api/projects/${projectId}/insights/${existing.id}/`, {
    method: "PATCH",
    body: JSON.stringify({
      dashboards: [...dashboards],
      description,
      query,
      saved: true,
    }),
  });
  return updated.id;
}

function trendsQuery(params: {
  series: JsonObject[];
  dateFrom?: string;
  interval?: "day" | "hour" | "week" | "month";
  display?: string;
  breakdown?: string;
  breakdownType?: "event" | "person";
  properties?: JsonObject[];
}): InsightQuery {
  const {
    series,
    dateFrom = "-30d",
    interval = "day",
    display = "ActionsLineGraph",
    breakdown,
    breakdownType = "event",
    properties = [],
  } = params;

  const source: JsonObject = {
    kind: "TrendsQuery",
    series,
    interval,
    dateRange: { date_from: dateFrom, explicitDate: false },
    properties,
    trendsFilter: { display },
    filterTestAccounts: false,
    version: 2,
  };

  if (breakdown) {
    source.breakdownFilter = { breakdown, breakdown_type: breakdownType };
  }

  return { kind: "InsightVizNode", source };
}

function funnelsQuery(params: {
  steps: JsonObject[];
  dateFrom?: string;
  interval?: "day" | "hour" | "week" | "month";
  breakdown?: string;
  breakdownType?: "event" | "person";
  viz?: "steps" | "time_to_convert" | "trends";
}): InsightQuery {
  const { steps, dateFrom = "-30d", interval = "day", breakdown, breakdownType = "event", viz = "steps" } = params;

  const source: JsonObject = {
    kind: "FunnelsQuery",
    series: steps,
    interval,
    dateRange: { date_from: dateFrom, explicitDate: false },
    properties: [],
    funnelsFilter: {
      layout: "horizontal",
      exclusions: [],
      funnelVizType: viz,
      funnelOrderType: "ordered",
      funnelStepReference: "total",
      funnelWindowInterval: 14,
      breakdownAttributionType: "first_touch",
      funnelWindowIntervalUnit: "day",
    },
    filterTestAccounts: false,
  };

  if (breakdown) {
    source.breakdownFilter = { breakdown, breakdown_type: breakdownType };
  }

  return { kind: "InsightVizNode", source };
}

async function main() {
  const overviewDashboardId = await ensureDashboard("Expert Builder – Overview", "Core product usage + lesson flow.");
  const roslynDashboardId = await ensureDashboard(
    "Expert Builder – Roslyn Health",
    "Runner lifecycle, timings, and errors."
  );

  const insightIds: number[] = [];

  // Overview
  insightIds.push(
    await ensureInsight({
      name: "EB – Daily active users (DAU)",
      dashboardId: overviewDashboardId,
      description: "Daily active users based on $pageview.",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "$pageview", name: "$pageview", math: "dau" }],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Lessons viewed",
      dashboardId: overviewDashboardId,
      description: "Lesson selections/views (client-side).",
      query: trendsQuery({ series: [{ kind: "EventsNode", event: "lesson_viewed", name: "lesson_viewed" }] }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Code runs initiated",
      dashboardId: overviewDashboardId,
      description: "Run button/shortcut usage (client-side).",
      query: trendsQuery({ series: [{ kind: "EventsNode", event: "code_run_initiated", name: "code_run_initiated" }] }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Submissions initiated",
      dashboardId: overviewDashboardId,
      description: "Submit button/shortcut usage (client-side).",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "code_submit_initiated", name: "code_submit_initiated" }],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Lessons completed",
      dashboardId: overviewDashboardId,
      description: "Lesson completion (client-side).",
      query: trendsQuery({ series: [{ kind: "EventsNode", event: "lesson_completed", name: "lesson_completed" }] }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Funnel: Lesson → Run → Submit",
      dashboardId: overviewDashboardId,
      description: "Conversion through the main lesson workflow.",
      query: funnelsQuery({
        steps: [
          { kind: "EventsNode", event: "lesson_viewed", name: "lesson_viewed", custom_name: "Lesson viewed" },
          { kind: "EventsNode", event: "code_run_initiated", name: "code_run_initiated", custom_name: "Run initiated" },
          {
            kind: "EventsNode",
            event: "code_submit_initiated",
            name: "code_submit_initiated",
            custom_name: "Submit initiated",
          },
        ],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Time to first run",
      dashboardId: overviewDashboardId,
      description: "Time-to-first-run from lesson view (funnel time to convert).",
      query: funnelsQuery({
        viz: "time_to_convert",
        steps: [
          { kind: "EventsNode", event: "lesson_viewed", name: "lesson_viewed", custom_name: "Lesson viewed" },
          { kind: "EventsNode", event: "code_run_initiated", name: "code_run_initiated", custom_name: "First run initiated" },
        ],
      }),
    })
  );

  // Roslyn Health
  insightIds.push(
    await ensureInsight({
      name: "EB – Runner lifecycle",
      dashboardId: roslynDashboardId,
      description: "Runner process lifecycle events.",
      query: trendsQuery({
        display: "ActionsLineGraph",
        series: [
          { kind: "EventsNode", event: "roslyn_runner_started", name: "runner_started" },
          { kind: "EventsNode", event: "roslyn_runner_ready", name: "runner_ready" },
          { kind: "EventsNode", event: "roslyn_runner_exited", name: "runner_exited" },
          { kind: "EventsNode", event: "roslyn_runner_error", name: "runner_error" },
          { kind: "EventsNode", event: "roslyn_runner_startup_timeout", name: "startup_timeout" },
        ],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Runner startup time (avg ms)",
      dashboardId: roslynDashboardId,
      description: "Average time from start until READY.",
      query: trendsQuery({
        series: [
          { kind: "EventsNode", event: "roslyn_runner_ready", name: "roslyn_runner_ready", math: "avg", math_property: "startup_ms" },
        ],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Execute requests",
      dashboardId: roslynDashboardId,
      description: "Execute endpoint requests (server-side).",
      query: trendsQuery({ series: [{ kind: "EventsNode", event: "roslyn_execute", name: "roslyn_execute" }] }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Execute latency (avg ms)",
      dashboardId: roslynDashboardId,
      description: "Average /api/execute duration_ms.",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "roslyn_execute", name: "roslyn_execute", math: "avg", math_property: "duration_ms" }],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Diagnostics latency (avg ms)",
      dashboardId: roslynDashboardId,
      description: "Average /api/diagnostics duration_ms.",
      query: trendsQuery({
        series: [
          { kind: "EventsNode", event: "roslyn_diagnostics", name: "roslyn_diagnostics", math: "avg", math_property: "duration_ms" },
        ],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Submit latency (avg ms)",
      dashboardId: roslynDashboardId,
      description: "Average /api/submit duration_ms.",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "roslyn_submit", name: "roslyn_submit", math: "avg", math_property: "duration_ms" }],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Submit success vs fail",
      dashboardId: roslynDashboardId,
      description: "Submit outcomes broken down by success property.",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "roslyn_submit", name: "roslyn_submit" }],
        breakdown: "success",
        display: "ActionsBarValue",
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – API errors",
      dashboardId: roslynDashboardId,
      description: "Server-side request errors by endpoint.",
      query: trendsQuery({
        display: "ActionsLineGraph",
        series: [
          { kind: "EventsNode", event: "roslyn_execute_error", name: "execute_error" },
          { kind: "EventsNode", event: "roslyn_diagnostics_error", name: "diagnostics_error" },
          { kind: "EventsNode", event: "roslyn_submit_error", name: "submit_error" },
        ],
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Request timeouts",
      dashboardId: roslynDashboardId,
      description: "Runner request timeouts (compile_only vs execute).",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "roslyn_request_timeout", name: "roslyn_request_timeout" }],
        breakdown: "compile_only",
        display: "ActionsBarValue",
      }),
    })
  );

  insightIds.push(
    await ensureInsight({
      name: "EB – Submit failures by lesson",
      dashboardId: roslynDashboardId,
      description: "Failed submissions broken down by lesson_id.",
      query: trendsQuery({
        series: [{ kind: "EventsNode", event: "roslyn_submit", name: "roslyn_submit" }],
        breakdown: "lesson_id",
        display: "ActionsBarValue",
        properties: [{ key: "success", type: "event", value: false, operator: "exact" }],
      }),
    })
  );

  console.log(`Dashboards ready: ${overviewDashboardId} (Overview), ${roslynDashboardId} (Roslyn Health)`);
  console.log(`Insights ensured: ${insightIds.length}`);
}

await main();
