import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Search, ClipboardList, PenTool, Newspaper, Settings,
  Sparkles, LogOut, FileText, Mail, Bell, CheckSquare, Users, Handshake, BarChart3,
  ShieldCheck,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { useAuth, useOrganisation } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

const ADMIN_EMAILS = ["founders@grantmatch.co.za", "admin@grantmatch.co.za", "info@nickfernandes.co.za"];

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Find Grants", url: "/grants", icon: Search },
  { title: "Applications", url: "/applications", icon: ClipboardList },
  { title: "Proposal Writer", url: "/writer", icon: PenTool },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Funder CRM", url: "/crm", icon: Handshake },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Partnerships", url: "/partnerships", icon: Users },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Email Hub", url: "/email", icon: Mail },
  { title: "News", url: "/news", icon: Newspaper },
  { title: "Team", url: "/team", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const typeIcons: Record<string, string> = {
  proposal_review: "📝",
  deadline: "⏰",
  task: "✅",
  ai_complete: "🤖",
  team_invite: "👥",
  partnership_request: "🤝",
  partnership_accepted: "🎉",
  interaction_due: "📞",
  match_new: "🎯",
};

function AppSidebarContent() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border/30">
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-sm font-semibold text-foreground">GrantMatch</span>}
      </div>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      activeClassName="text-primary bg-primary/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4 border-t border-border/30">
        <SidebarOrgInfo collapsed={collapsed} />
      </div>
    </Sidebar>
  );
}

function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-primary hover:underline">Mark all read</button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications yet</div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n.id}
                to={n.link || "#"}
                onClick={() => !n.read && markRead(n.id)}
                className={`block px-4 py-3 border-b border-border/10 hover:bg-secondary/20 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                      {n.title}
                      {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{n.body}</div>
                    <div className="text-[9px] text-muted-foreground/60 mt-1">
                      {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="px-4 py-2 border-t border-border/30 text-center">
            <Link to="/settings?tab=notifications" className="text-[10px] text-primary hover:underline">
              Notification preferences
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SidebarOrgInfo({ collapsed }: { collapsed: boolean }) {
  const { org } = useOrganisation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const initials = org?.name ? org.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() : "??";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-primary">{initials}</span>
      </div>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{org?.name || "Loading..."}</div>
          <button onClick={handleSignOut} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 mt-0.5">
            <LogOut className="h-2.5 w-2.5" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useAuth();
  const { org, loading: orgLoading } = useOrganisation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
    if (!loading && !orgLoading && user) {
      if (!org || !org.onboarding_complete) {
        navigate("/onboarding");
      }
    }
  }, [loading, orgLoading, user, org, navigate]);

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-bg">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between gap-4 px-4 border-b border-border/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
