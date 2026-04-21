import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "gm_visitor_id";
const SESSION_KEY = "gm_session_id";
const SESSION_START_KEY = "gm_session_start";
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// Use untyped client to avoid waiting on regenerated types
const db = supabase as any;

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

function detectDevice(ua: string) {
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
  // Generate the session id client-side so we don't need to read it back
  // (RLS blocks SELECT on analytics tables — write-only for visitors).
  const sessionId = crypto.randomUUID();

  const { error } = await db
    .from("analytics_sessions")
    .insert({
      id: sessionId,
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
    });

  if (error) {
    console.error("[analytics] startSession failed:", error);
    return null;
  }
  sessionStorage.setItem(SESSION_KEY, sessionId);
  sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  return sessionId;
}

async function trackPageView(path: string, sessionId: string) {
  const visitorId = getOrCreateVisitorId();
  await db.from("analytics_page_views").insert({
    session_id: sessionId,
    visitor_id: visitorId,
    path,
    title: document.title,
    referrer: document.referrer || null,
  });
  const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
  const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
  await db
    .from("analytics_sessions")
    .update({ last_seen_at: new Date().toISOString(), duration_seconds: duration })
    .eq("id", sessionId);

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
      if (!initialized.current) initialized.current = true;
      await trackPageView(location.pathname, sessionId);
    })();
    return () => { active = false; };
  }, [location.pathname]);

  useEffect(() => {
    // Heartbeat: every 30s update last_seen_at + duration so engagement metrics aren't stuck at 0
    const tick = async () => {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId || document.hidden) return;
      const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
      const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
      try {
        await db
          .from("analytics_sessions")
          .update({ last_seen_at: new Date().toISOString(), duration_seconds: duration })
          .eq("id", sessionId);
      } catch {}
    };
    const interval = setInterval(tick, 30000);

    const handleUnload = () => {
      const sessionId = sessionStorage.getItem(SESSION_KEY);
      if (!sessionId) return;
      const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || "0", 10);
      const duration = start ? Math.round((Date.now() - start) / 1000) : 0;
      try {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics_sessions?id=eq.${sessionId}`,
          new Blob(
            [JSON.stringify({ ended_at: new Date().toISOString(), duration_seconds: duration })],
            { type: "application/json" }
          )
        );
      } catch {}
    };
    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);
}
