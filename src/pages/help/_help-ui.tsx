import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export const PageHeader = ({ title, intro }: { title: string; intro: string }) => (
  <header className="mb-4">
    <h2 className="text-xl font-semibold text-foreground">{title}</h2>
    <p className="text-sm text-muted-foreground mt-1">{intro}</p>
  </header>
);

export const Steps = ({ items }: { items: string[] }) => (
  <ol className="space-y-2 text-sm text-foreground/90 list-decimal pl-5 my-4">
    {items.map((s, i) => <li key={i}>{s}</li>)}
  </ol>
);

export const Tip = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-foreground/90 my-3">
    💡 <span className="text-muted-foreground">Tip — </span>{children}
  </div>
);

export const StartTourButton = () => (
  <Button size="sm" variant="outline" className="my-2"
    onClick={() => window.dispatchEvent(new CustomEvent("gm:start-tour"))}>
    <Play className="h-3 w-3 mr-1" /> Start interactive tour
  </Button>
);

export const RouteLink = ({ to, label }: { to: string; label: string }) => (
  <Button size="sm" variant="ghost" asChild className="text-primary">
    <Link to={to}>Open {label} →</Link>
  </Button>
);
