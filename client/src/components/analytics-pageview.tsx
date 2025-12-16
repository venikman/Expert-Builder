import { useEffect } from "react";
import { useLocation } from "wouter";
import { trackPageview } from "@/lib/analytics";

export function AnalyticsPageview() {
  const [location] = useLocation();

  useEffect(() => {
    trackPageview(location);
  }, [location]);

  return null;
}

