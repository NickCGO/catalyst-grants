import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "gm_visitor_id";
const SESSION_KEY = "gm_session_id";
const SESSION_START_KEY = "gm_session_start";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function detectDevice(ua: string): { device: string; browser: string; os: string } {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const isTablet = /iPad|Tablet/i.test(ua);
  const device = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";
  let browser = "Unknown";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Mac OS/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iOS/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";
  return { device, browser, os };
}

async function startSession(path: string): Promise<string | null> {
  const visitorId = getOrCreateVisitorId();
  const ua = navigator.userAgent;
  const { device, browser, os } = detectDevice(ua);
  const params = new URLSearchParams(window.location.search);

  const { data, error } = await supabase
    .from("analytics_sessions")
    .insert({
      visitor_id: visitorId,
      referrer: document.referrer || null,
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      landing_path: path,
      user_agent: ua,
      device_type: device,
      browser,
      os,
      language: navigator.language,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  sessionStorage.setItem(SESSION_KEY, data.id);
  sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  return data.id;
}

async function endSession(sessionId: string) {
  const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
  const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
  await supabase
    .from("analytics_sessions")
    .update({
      ended_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      duration_seconds: duration,
    })
    .eq("id", sessionId);
}

async function trackPageView(path: string, sessionId: string) {
  const visitorId = getOrCreateVisitorId();
  await supabase.from("analytics_page_views").insert({
    session_id: sessionId,
    visitor_id: visitorId,
    path,
    title: document.title,
    referrer: document.referrer || null,
  });
  // bump page_count + last_seen
  const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
  const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
  await supabase.rpc as any; // noop type guard
  await supabase
    .from("analytics_sessions")
    .update({
      last_seen_at: new Date().toISOString(),
      duration_seconds: duration,
    })
    .eq("id", sessionId);

  // GA4 page_view
  const w = window as any;
  if (typeof w.gtag === "function") {
    w.gtag("event", "page_view", { page_path: path, page_title: document.title });
  }
}

export function useAnalytics() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      let sessionId = sessionStorage.getItem(SESSION_KEY);
      const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
      const expired = !start || Date.now() - start > SESSION_TIMEOUT_MS;

      if (!sessionId || expired) {
        sessionId = await startSession(location.pathname);
      }
      if (!sessionId || !active) return;

      if (!initialized.current) {
        initialized.current = true;
      }
      await trackPageView(location.pathname, sessionId);
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleUnload = () => {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (sessionId) {
        const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
        const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_sessions?id=eq.${sessionId}`,
          new Blob(
            [JSON.stringify({ ended_at: new Date().toISOString(), duration_seconds: duration })],
            { type: "application/json" }
          )
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);
}
