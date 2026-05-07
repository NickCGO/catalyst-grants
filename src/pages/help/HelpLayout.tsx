import { Outlet, NavLink, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";

const sections = [
  { to: "/help", label: "Getting started", end: true },
  { to: "/help/dashboard", label: "Dashboard" },
  { to: "/help/grants", label: "Find Grants" },
  { to: "/help/applications", label: "Applications" },
  { to: "/help/proposals", label: "Proposal Writer" },
  { to: "/help/tasks", label: "Tasks & Deadlines" },
  { to: "/help/crm", label: "Funder CRM" },
  { to: "/help/inbox", label: "Inbox & Email" },
  { to: "/help/reports", label: "Impact Reports" },
  { to: "/help/team", label: "Team & Roles" },
  { to: "/help/settings", label: "Settings" },
  { to: "/help/faq", label: "FAQ" },
];

export default function HelpLayout() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to app
          </Link>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mt-2">
            <BookOpen className="h-6 w-6 text-primary" /> Help Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            How to use GrantMatch — concise guides for every part of the app.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
          <nav className="space-y-1">
            {sections.map((s) => (
              <NavLink key={s.to} to={s.to} end={s.end}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-xs transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`
                }>
                {s.label}
              </NavLink>
            ))}
          </nav>

          <article className="prose prose-sm max-w-none text-foreground">
            <Outlet />
          </article>
        </div>
      </div>
    </DashboardLayout>
  );
}
