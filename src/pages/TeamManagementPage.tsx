import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Mail, Shield, Eye, PenTool, CheckCircle, Clock, MoreHorizontal } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useOrganisation } from "@/hooks/useAuth";

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string; desc: string }> = {
  owner: { label: "Owner", icon: Shield, color: "text-accent-amber", desc: "Full access, billing, manage all team members" },
  admin: { label: "Admin", icon: Shield, color: "text-primary", desc: "All features except billing and delete" },
  writer: { label: "Writer", icon: PenTool, color: "text-success", desc: "Create/edit proposals, add applications, log interactions" },
  reviewer: { label: "Reviewer", icon: CheckCircle, color: "text-accent-teal", desc: "Review and approve proposals (read most things)" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground", desc: "Read-only access to everything" },
};

type Role = keyof typeof roleConfig;

const TeamManagementPage = () => {
  const { user } = useAuth();
  const { org } = useOrganisation();
  const [team, setTeam] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("writer");

  useEffect(() => {
    if (!org) return;
    const load = async () => {
      const [{ data: members }, { data: invites }] = await Promise.all([
        supabase.from("team_members").select("*").eq("org_id", org.id),
        supabase.from("team_invitations").select("*").eq("org_id", org.id).eq("accepted", false),
      ]);
      setTeam(members || []);
      setInvitations(invites || []);
      setLoading(false);
    };
    load();
  }, [org]);

  const sendInvite = async () => {
    if (!inviteEmail || !org || !user) return;
    const { error } = await supabase.from("team_invitations").insert({
      org_id: org.id,
      invited_email: inviteEmail,
      role: inviteRole,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    // Also add as team member with pending status
    await supabase.from("team_members").insert({
      org_id: org.id,
      user_id: user.id, // placeholder - will be updated when they accept
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      invited_by: user.id,
    });
    toast({ title: "Invitation sent!", description: `${inviteEmail} has been invited as ${roleConfig[inviteRole].label}` });
    setInviteEmail("");
    setInviteOpen(false);
    // Reload
    const { data: invites } = await supabase.from("team_invitations").select("*").eq("org_id", org.id).eq("accepted", false);
    setInvitations(invites || []);
  };

  if (loading) return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    </DashboardLayout>
  );

  // If no team members yet, the owner is the only one
  const displayTeam = team.length > 0 ? team : user ? [{
    id: "owner",
    full_name: user.email?.split("@")[0] || "You",
    email: user.email,
    role: "owner",
    status: "active",
    last_active: new Date().toISOString(),
  }] : [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Team Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{displayTeam.length} member{displayTeam.length !== 1 ? "s" : ""} · {org?.name || "Your Organisation"}</p>
          </div>
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Invite Team Member</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  They'll receive an email to join your organisation on GrantMatch.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Email Address</Label>
                  <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.org" className="mt-1 bg-secondary/30 border-border/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Role</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {(Object.entries(roleConfig) as [Role, typeof roleConfig.owner][]).filter(([k]) => k !== "owner").map(([key, val]) => (
                      <button key={key} onClick={() => setInviteRole(key)}
                        className={`p-2.5 rounded-lg text-left border transition-colors ${inviteRole === key ? "border-primary bg-primary/10" : "border-border/30 hover:bg-secondary/30"}`}>
                        <div className="flex items-center gap-2">
                          <val.icon className={`h-3.5 w-3.5 ${val.color}`} />
                          <span className="text-xs font-medium text-foreground">{val.label}</span>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{val.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={sendInvite} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Mail className="h-4 w-4 mr-1" /> Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Permission Matrix */}
        <GlassCard hoverable={false} className="mb-6 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Role Permissions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 text-muted-foreground font-medium">Feature</th>
                  {Object.values(roleConfig).map(r => (
                    <th key={r.label} className="text-center py-2 text-muted-foreground font-medium px-2">{r.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "View grants & CRM", perms: [true, true, true, true, true] },
                  { feature: "Write proposals", perms: [true, true, true, false, false] },
                  { feature: "Review/approve proposals", perms: [true, true, false, true, false] },
                  { feature: "Manage team", perms: [true, true, false, false, false] },
                  { feature: "View analytics", perms: [true, true, true, true, true] },
                  { feature: "Billing", perms: [true, false, false, false, false] },
                ].map(row => (
                  <tr key={row.feature} className="border-b border-border/10">
                    <td className="py-1.5 text-foreground">{row.feature}</td>
                    {row.perms.map((p, i) => (
                      <td key={i} className="text-center">{p ? "✅" : "—"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <GlassCard hoverable={false} className="mb-4 p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pending Invitations</h3>
            <div className="space-y-2">
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20">
                  <div>
                    <span className="text-xs text-foreground">{inv.invited_email}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">as {roleConfig[inv.role as Role]?.label || inv.role}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] border-accent-amber/40 text-accent-amber">
                    <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Team Members */}
        <GlassCard hoverable={false}>
          <div className="divide-y divide-border/20">
            {displayTeam.map((member, i) => {
              const role = roleConfig[(member.role as Role) || "viewer"];
              const initials = (member.full_name || member.email || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
              return (
                <motion.div key={member.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{member.full_name || member.email}</span>
                      {member.status === "pending" && (
                        <Badge variant="outline" className="text-[9px] border-accent-amber/40 text-accent-amber px-1.5 py-0">
                          <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {role && <role.icon className={`h-3.5 w-3.5 ${role.color}`} />}
                    <span className="text-xs text-foreground">{role?.label || member.role}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default TeamManagementPage;
