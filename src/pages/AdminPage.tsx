import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Users, ListChecks, Database, BarChart3, Shield, Search,
  Trash2, UserCheck, UserX, Download, RefreshCw, Plus, Activity,
  Globe, Monitor, Clock, TrendingUp,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ADMIN_EMAILS = ["founders@grantmatch.co.za", "admin@grantmatch.co.za", "info@nickfernandes.co.za"];

async function adminCall(action: string, params: Record<string, any> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/admin-api`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ action, ...params }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── Stats Overview ──────────────────────────────────────────────────────────
function StatsOverview() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCall("platform_stats");
      setStats(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cards = [
    { label: "Auth Users", value: stats?.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Waitlist Signups", value: stats?.totalWaitlist, icon: ListChecks, color: "text-amber-400" },
    { label: "Organisations", value: stats?.totalOrgs, icon: Shield, color: "text-green-400" },
    { label: "Funders", value: stats?.totalFunders, icon: Database, color: "text-purple-400" },
    { label: "Proposals", value: stats?.totalProposals, icon: BarChart3, color: "text-teal-400" },
    { label: "Applications", value: stats?.totalApplications, icon: ListChecks, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Platform Overview</h2>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="bg-card/50 border-border/30">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <c.icon className={`h-5 w-5 ${c.color}`} />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-7 w-12" /> : (c.value ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── User Management ─────────────────────────────────────────────────────────
function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCall("list_users", { perPage: 200 });
      setUsers(data.users || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleBeta = async (userId: string) => {
    try {
      await adminCall("toggle_beta", { userId });
      toast({ title: "Beta access toggled" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await adminCall("delete_user", { userId });
      toast({ title: "User deleted" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = users.filter((u) =>
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Beta</TableHead>
                <TableHead>Org</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-sm">{u.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {u.user_metadata?.beta_tester ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Beta</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {u.user_metadata?.org_name || "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => toggleBeta(u.id)} title="Toggle beta">
                      {u.user_metadata?.beta_tester ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete {u.email} and all their data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteUser(u.id)} className="bg-destructive text-destructive-foreground">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Waitlist Management ─────────────────────────────────────────────────────
function WaitlistManagement() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminCall("list_waitlist");
      setEntries(data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const promoteToBeta = async (email: string) => {
    try {
      await adminCall("promote_to_beta", { email });
      toast({ title: "Promoted to beta", description: `${email} now has beta access` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await adminCall("delete_waitlist_entry", { entryId: id });
      toast({ title: "Entry removed" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const exportCSV = () => {
    const headers = "Name,Email,Organisation,Country,Role,Committed,Position,Date\n";
    const rows = entries.map((e) =>
      `"${e.name || ""}","${e.email}","${e.organisation || ""}","${e.country || ""}","${e.role || ""}",${e.committed_to_pay},${e.position || ""},${e.created_at}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filtered = entries.filter((e) =>
    (e.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (e.organisation || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search waitlist..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5 mr-1.5" /> Export
        </Button>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{entries.length} total signups, {entries.filter(e => e.committed_to_pay).length} committed to pay</p>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs text-muted-foreground">{e.position || "—"}</TableCell>
                  <TableCell className="text-sm">{e.name || "—"}</TableCell>
                  <TableCell className="text-sm font-medium">{e.email}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.organisation || "—"}</TableCell>
                  <TableCell className="text-xs">{e.country || "—"}</TableCell>
                  <TableCell>
                    {e.committed_to_pay ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Yes</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">No</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(e.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => promoteToBeta(e.email)} title="Promote to beta">
                      <UserCheck className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEntry(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ─── Funder Management ───────────────────────────────────────────────────────
function FunderManagement() {
  const [funders, setFunders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newFunder, setNewFunder] = useState({ donor_name: "", category: "", email: "", website: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("funders").select("id, donor_name, category, email, website, geographical_area").order("donor_name").limit(500);
      if (error) throw error;
      setFunders(data || []);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteFunder = async (id: string) => {
    try {
      await adminCall("delete_funder", { funderId: id });
      toast({ title: "Funder deleted" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const addFunder = async () => {
    if (!newFunder.donor_name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    try {
      await adminCall("add_funder", { funder: newFunder });
      toast({ title: "Funder added" });
      setAddOpen(false);
      setNewFunder({ donor_name: "", category: "", email: "", website: "" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = funders.filter((f) =>
    f.donor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search funders..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Funder
        </Button>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{funders.length} funders loaded (showing up to 500)</p>

      {loading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-auto max-h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 100).map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="text-sm font-medium">{f.donor_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{f.category || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{f.geographical_area || "—"}</TableCell>
                  <TableCell className="text-xs">{f.email || "—"}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {f.donor_name}?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently remove this funder from the database.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteFunder(f.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Funder</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Funder Name *</Label><Input value={newFunder.donor_name} onChange={(e) => setNewFunder({ ...newFunder, donor_name: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={newFunder.category} onChange={(e) => setNewFunder({ ...newFunder, category: e.target.value })} placeholder="e.g. Corporate, Trust, International" /></div>
            <div><Label>Email</Label><Input value={newFunder.email} onChange={(e) => setNewFunder({ ...newFunder, email: e.target.value })} /></div>
            <div><Label>Website</Label><Input value={newFunder.website} onChange={(e) => setNewFunder({ ...newFunder, website: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={addFunder}>Add Funder</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin Page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    if (!ADMIN_EMAILS.includes(user.email ?? "")) {
      navigate("/dashboard");
      return;
    }
    setAuthorized(true);
  }, [user, authLoading, navigate]);

  if (authLoading || !authorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Manage users, waitlist, and platform data</p>
          </div>
          <Badge variant="outline" className="ml-auto text-xs">{user?.email}</Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-card/50">
            <TabsTrigger value="overview"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-3.5 w-3.5 mr-1.5" />Users</TabsTrigger>
            <TabsTrigger value="waitlist"><ListChecks className="h-3.5 w-3.5 mr-1.5" />Waitlist</TabsTrigger>
            <TabsTrigger value="funders"><Database className="h-3.5 w-3.5 mr-1.5" />Funders</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><StatsOverview /></TabsContent>
          <TabsContent value="users"><UserManagement /></TabsContent>
          <TabsContent value="waitlist"><WaitlistManagement /></TabsContent>
          <TabsContent value="funders"><FunderManagement /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
