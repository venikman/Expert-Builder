type AnalyticsProperties = Record<string, unknown>;

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_HOST =
  process.env.POSTHOG_HOST || process.env.PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

function normalizeHost(host: string): string {
  return host.endsWith("/") ? host.slice(0, -1) : host;
}

function captureUrl(): string {
  return `${normalizeHost(POSTHOG_HOST)}/capture/`;
}

export function isServerAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_API_KEY);
}

export function trackServerEvent(
  event: string,
  distinctId: string,
  properties?: AnalyticsProperties
) {
  if (!POSTHOG_API_KEY) return;

  const payload = {
    api_key: POSTHOG_API_KEY,
    event,
    distinct_id: distinctId,
    properties: {
      ...properties,
      service: "api",
      env: process.env.NODE_ENV || "development",
    },
    timestamp: new Date().toISOString(),
  };

  queueMicrotask(() => {
    fetch(captureUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Best-effort only. Never block requests or crash on analytics failures.
    });
  });
}

