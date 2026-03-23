import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  ClipboardList,
  PenTool,
  Newspaper,
  Settings,
  Sparkles,
  LogOut,
  ChevronLeft,
  FileText,
  Mail,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Find Grants", url: "/grants", icon: Search },
  { title: "Applications", url: "/applications", icon: ClipboardList },
  { title: "Proposal Writer", url: "/writer", icon: PenTool },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Email Hub", url: "/email", icon: Mail },
  { title: "News", url: "/news", icon: Newspaper },
  { title: "Settings", url: "/settings", icon: Settings },
];

function AppSidebarContent() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
                      end
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                      activeClassName="text-primary bg-primary/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{item.title}</span>
                      )}
                      {!collapsed && item.badge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                          {item.badge}
                        </span>
                      )}
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

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full gradient-bg">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-4 px-4 border-b border-border/30">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
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
