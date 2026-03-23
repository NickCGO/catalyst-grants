import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Search, ClipboardList, PenTool, Newspaper, Settings,
  Sparkles, LogOut, FileText, Mail, Bell, CheckSquare, Users,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider,
  SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Find Grants", url: "/grants", icon: Search },
  { title: "Applications", url: "/applications", icon: ClipboardList },
  { title: "Proposal Writer", url: "/writer", icon: PenTool },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Email Hub", url: "/email", icon: Mail },
  { title: "News", url: "/news", icon: Newspaper },
  { title: "Team", url: "/team", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const mockNotifications = [
  { id: "1", type: "proposal_review", title: "Review requested", body: "James submitted the DG Murray proposal for review", link: "/writer", time: "5 min ago", read: false },
  { id: "2", type: "deadline", title: "Deadline approaching", body: "Anglo American application due in 7 days", link: "/applications", time: "1 hour ago", read: false },
  { id: "3", type: "task", title: "Task assigned", body: "You've been assigned: Collect M&E data", link: "/tasks", time: "2 hours ago", read: false },
  { id: "4", type: "ai_complete", title: "Proposal generated", body: "AI finished writing the NLC proposal", link: "/writer", time: "3 hours ago", read: true },
  { id: "5", type: "team_invite", title: "New team member", body: "Thabo Khumalo joined as Viewer", link: "/team", time: "1 day ago", read: true },
];

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
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">EF</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-foreground truncate">Elizayo Foundation</div>
              <div className="text-[10px] text-muted-foreground">Free plan</div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

function NotificationBell() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

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
          {notifications.map(n => (
            <Link key={n.id} to={n.link}
              className={`block px-4 py-3 border-b border-border/10 hover:bg-secondary/20 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
              <div className="flex items-start gap-2">
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                <div className={!n.read ? "" : "ml-4"}>
                  <div className="text-xs font-medium text-foreground">{n.title}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{n.body}</div>
                  <div className="text-[9px] text-muted-foreground/60 mt-1">{n.time}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
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
