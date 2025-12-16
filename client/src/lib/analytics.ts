import posthog from "posthog-js";

type AnalyticsProperties = Record<string, unknown>;

const env = (import.meta.env ?? {}) as Record<string, unknown>;
const POSTHOG_KEY = env.PUBLIC_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = env.PUBLIC_POSTHOG_HOST as string | undefined;
const POSTHOG_DEBUG = env.PUBLIC_POSTHOG_DEBUG === "true";
const POSTHOG_AUTOCAPTURE = env.PUBLIC_POSTHOG_AUTOCAPTURE === "true";
const IS_DEV = Boolean(env.DEV);

export function isAnalyticsEnabled(): boolean {
  return Boolean(POSTHOG_KEY);
}

export function initAnalytics() {
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST || "https://app.posthog.com",
    autocapture: POSTHOG_AUTOCAPTURE,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    loaded: (ph) => {
      if (IS_DEV && POSTHOG_DEBUG) {
        ph.debug();
      }
    },
  });
}

export function track(event: string, properties?: AnalyticsProperties) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function trackPageview(path: string) {
  if (!POSTHOG_KEY) return;
  posthog.capture("$pageview", {
    path,
    $current_url: window.location.href,
  });
}

export function getDistinctId(): string | undefined {
  if (!POSTHOG_KEY) return undefined;
  try {
    return posthog.get_distinct_id();
  } catch {
    return undefined;
  }
}
