import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { HelpCircle, BookOpen, Play, MessageCircle, X } from "lucide-react";

// Hide on these route prefixes (public pages, onboarding, auth)
const HIDE_ON = ["/", "/login", "/signup", "/onboarding", "/accept-invite"];

export default function HelpFloatingButton() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  // Hide button on public/onboarding routes
  if (HIDE_ON.some((p) => loc.pathname === p || (p !== "/" && loc.pathname.startsWith(p)))) {
    return null;
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="bg-card border border-border/40 rounded-xl shadow-lg p-2 w-56 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Link
              to="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/40 rounded-lg"
            >
              <BookOpen className="h-3.5 w-3.5 text-primary" /> Open Help center
            </Link>
            <button
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("gm:start-tour"));
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/40 rounded-lg"
            >
              <Play className="h-3.5 w-3.5 text-primary" /> Replay product tour
            </button>
            <Link
              to="/settings?tab=notifications"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-secondary/40 rounded-lg"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Contact support
            </Link>
          </div>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Help"
          className="h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
        >
          {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </button>
      </div>
    </>
  );
}
