import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Mail, Shield, Eye, PenTool, Clock, Trash2, Copy,
  Check, Inbox, Send, Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import GlassCard from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { hints } from "@/lib/formHints";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useOrganisation } from "@/hooks/useAuth";

// Role hierarchy & metadata
const roleConfig = {
  owner: { label: "Owner", icon: Shield, color: "text-accent-amber",
    desc: "Full control, billing, can transfer ownership" },
  admin: { label: "Admin", icon: Shield, color: "text-primary",
    desc: "Manage team, members, and all org data" },
  editor: { label: "Editor", icon: PenTool, color: "text-success",
    desc: "Create & edit applications, proposals, CRM" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground",
    desc: "Read-only access to everything" },
} as const;

type Role = keyof typeof roleConfig;
const assignableRoles: Role[] = ["admin", "editor", "viewer"];

// Inbound email domain — change here if you migrate to a different subdomain
const INBOUND_DOMAIN = "inbox.grant-match.app";

const TeamManagementPage = () => {
  const { user } = useAuth();
  const { org, refetch: refetchOrg } = useOrganisation();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("editor");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const inboundAddress = org?.inbound_mailbox_token
    ? `${org.inbound_mailbox_token}@${INBOUND_DOMAIN}`
    : null;

  const isAdmin = myRole === "owner" || myRole === "admin";

  const load = useCallback(async () => {
    if (!org?.id || !user) return;
    setLoading(true);
    const [{ data: m }, { data: i }] = await Promise.all([
      supabase.from("team_members").select("*").eq("org_id", org.id).order("joined_at", { ascending: true }),
      supabase.from("team_invites").select("*").eq("org_id", org.id).eq("status", "pending").order("created_at", { ascending: false }),
    ]);
    setMembers(m || []);
    setInvites(i || []);
    const me = (m || []).find((r) => r.user_id === user.id);
    setMyRole((me?.role as Role) || "viewer");
    setLoading(false);
  }, [org?.id, user]);

  useEffect(() => { load(); }, [load]);

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !org || !user) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) {
      toast({ title: "Invalid email address", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("team_invites").insert({
      org_id: org.id,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invited_by: user.id,
    });
    setSending(false);
    if (error) {
      toast({ title: "Could not send invite", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invitation created", description: `${inviteEmail} can join as ${roleConfig[inviteRole].label}.` });
    setInviteEmail("");
    setInviteOpen(false);
    load();
  };

  const cancelInvite = async (id: string) => {
    await supabase.from("team_invites").delete().eq("id", id);
    setInvites((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Invitation cancelled" });
  };

  const updateRole = async (memberId: string, role: Role) => {
    const { error } = await supabase.from("team_members").update({ role }).eq("id", memberId);
    if (error) {
      toast({ title: "Could not update role", description: error.message, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    toast({ title: "Role updated" });
  };

  const removeMember = async (memberId: string) => {
    const target = members.find((m) => m.id === memberId);
    if (target?.role === "owner") {
      toast({ title: "Owner cannot be removed", variant: "destructive" });
      return;
    }
    if (!confirm("Remove this team member? They'll lose access immediately.")) return;
    const { error } = await supabase.from("team_members").delete().eq("id", memberId);
    if (error) {
      toast({ title: "Could not remove member", description: error.message, variant: "destructive" });
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast({ title: "Member removed" });
  };

  const copyInbound = async () => {
    if (!inboundAddress) return;
    await navigator.clipboard.writeText(inboundAddress);
    setCopied(true);
    toast({ title: "Address copied" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" /> Team Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {members.length} member{members.length !== 1 ? "s" : ""} · {org?.name || "Your Organisation"}
            </p>
          </div>
          {isAdmin && (
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
                    They'll join as soon as they sign in with this email address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Email Address</Label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@example.org"
                      className="mt-1 bg-secondary/30 border-border/50"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Must match the email they'll use to sign in.
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Role</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5 mb-1">{hints.team.role}</p>
                    <div className="grid grid-cols-1 gap-2 mt-1">
                      {assignableRoles.map((key) => {
                        const val = roleConfig[key];
                        return (
                          <button
                            key={key}
                            onClick={() => setInviteRole(key)}
                            className={`p-2.5 rounded-lg text-left border transition-colors ${
                              inviteRole === key ? "border-primary bg-primary/10" : "border-border/30 hover:bg-secondary/30"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <val.icon className={`h-3.5 w-3.5 ${val.color}`} />
                              <span className="text-xs font-medium text-foreground">{val.label}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{val.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    onClick={sendInvite}
                    disabled={sending}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Per-org inbound mailbox */}
        <GlassCard hoverable={false}>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" /> Your Organisation's Inbound Email Address
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Share this address with funders so their replies land in your in-platform inbox.
                  Once the inbound provider is connected, replies will auto-link to the matching funder relationship.
                </p>
              </div>
            </div>
            {inboundAddress ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-border/30 bg-secondary/20">
                <Send className="h-3.5 w-3.5 text-primary shrink-0" />
                <code className="text-xs text-foreground flex-1 truncate select-all">{inboundAddress}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyInbound}
                  className="h-7 text-[10px] gap-1"
                >
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground italic">No inbound address yet — refresh after a moment.</p>
            )}
            <p className="text-[10px] text-muted-foreground/70 mt-2">
              Note: incoming mail to <code className="text-foreground/70">{INBOUND_DOMAIN}</code> requires
              MX records pointing at your inbound provider (Postmark, SendGrid Parse, CloudMailin, etc.).
              The receiving webhook is already deployed.
            </p>
          </div>
        </GlassCard>

        {/* Pending Invitations */}
        {invites.length > 0 && (
          <GlassCard hoverable={false}>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Pending Invitations <span className="text-muted-foreground font-normal">({invites.length})</span>
              </h3>
              <div className="space-y-2">
                {invites.map((inv) => {
                  const expiresAt = new Date(inv.expires_at);
                  const expired = expiresAt < new Date();
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/20 border border-border/20">
                      <div className="min-w-0">
                        <span className="text-xs text-foreground">{inv.email}</span>
                        <span className="text-[10px] text-muted-foreground ml-2">
                          as {roleConfig[inv.role as Role]?.label || inv.role}
                        </span>
                        <div className="text-[9px] text-muted-foreground/70 mt-0.5">
                          {expired ? "Expired" : `Expires ${expiresAt.toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[9px] ${expired ? "border-destructive/40 text-destructive" : "border-accent-amber/40 text-accent-amber"}`}>
                          <Clock className="h-2.5 w-2.5 mr-0.5" /> {expired ? "Expired" : "Pending"}
                        </Badge>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => cancelInvite(inv.id)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Team members */}
        <GlassCard hoverable={false}>
          <div className="divide-y divide-border/20">
            {members.map((member, i) => {
              const roleKey = (member.role as Role) || "viewer";
              const role = roleConfig[roleKey] || roleConfig.viewer;
              const initials = (member.full_name || member.email || "?")
                .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
              const isMe = member.user_id === user?.id;
              const canManage = isAdmin && !isMe && roleKey !== "owner";
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {member.full_name || member.email}
                      </span>
                      {isMe && (
                        <Badge variant="outline" className="text-[9px] border-primary/40 text-primary px-1.5 py-0">
                          You
                        </Badge>
                      )}
                      {member.status === "pending" && (
                        <Badge variant="outline" className="text-[9px] border-accent-amber/40 text-accent-amber px-1.5 py-0">
                          <Clock className="h-2.5 w-2.5 mr-0.5" /> Pending
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {canManage ? (
                      <select
                        value={roleKey}
                        onChange={(e) => updateRole(member.id, e.target.value as Role)}
                        className="text-xs bg-secondary/30 border border-border/50 rounded-md px-2 py-1 text-foreground"
                      >
                        {assignableRoles.map((r) => (
                          <option key={r} value={r}>{roleConfig[r].label}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <role.icon className={`h-3.5 w-3.5 ${role.color}`} />
                        <span className="text-xs text-foreground">{role.label}</span>
                      </div>
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeMember(member.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>

        {/* Role permission matrix */}
        <GlassCard hoverable={false}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">What each role can do</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 text-muted-foreground font-medium">Permission</th>
                    {(["owner", "admin", "editor", "viewer"] as Role[]).map((r) => (
                      <th key={r} className="text-center py-2 text-muted-foreground font-medium px-2">
                        {roleConfig[r].label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "View grants, applications & CRM", perms: [true, true, true, true] },
                    { feature: "Create & edit applications", perms: [true, true, true, false] },
                    { feature: "Send CRM emails", perms: [true, true, true, false] },
                    { feature: "Edit organisation profile", perms: [true, true, true, false] },
                    { feature: "Invite & manage team", perms: [true, true, false, false] },
                    { feature: "Billing & ownership", perms: [true, false, false, false] },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-border/10">
                      <td className="py-1.5 text-foreground">{row.feature}</td>
                      {row.perms.map((p, i) => (
                        <td key={i} className="text-center">{p ? "✓" : "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
};

export default TeamManagementPage;
