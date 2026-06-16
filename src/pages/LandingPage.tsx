import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AnimatedCounter from "@/components/AnimatedCounter";
import founderNick from "@/assets/founder-nick.png";
import founderChantal from "@/assets/founder-chantal.jpeg";
import previewMatchEngine from "@/assets/preview-match-engine.jpg";
import previewProposalWriter from "@/assets/preview-proposal-writer.jpg";
import previewPipeline from "@/assets/preview-pipeline.jpg";
import brandLogo from "@/assets/find-the-grant-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AfricaSpinner from "../components/AfricaSpinner";

/* ─── Helpers ─── */
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { delay, duration: 0.6, ease: "easeOut" as const } },
});

/* ─── Brand wordmark ─── */
function Wordmark({ size = "text-2xl" }: { size?: string }) {
  const iconSize = size === "text-lg" ? "h-7 w-7" : "h-9 w-9";
  return (
    <div className="flex items-center gap-2">
      <img src={brandLogo.url} alt="Find The Grant" className={`${iconSize} rounded-md object-cover`} />
      <span className={`${size} font-bold text-foreground tracking-tight`}>Find The Grant</span>
    </div>
  );
}

/* ─── Nav ─── */
function Nav({ waitlistCount }: { waitlistCount: number }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center justify-between px-6 lg:px-12 transition-all duration-300 ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border" : "bg-background"
      }`}
    >
      <Wordmark />
      <div className="flex items-center gap-5">
        <span className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" />
          <AnimatedCounter end={waitlistCount} className="text-foreground font-semibold" /> NGOs already waiting
        </span>
        <Link to="/login" className="hidden md:inline-flex">
          <Button variant="ghost" className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl px-4">
            Log In
          </Button>
        </Link>
        <a href="#pricing">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm px-5 py-2 shadow-sm">
            Claim your spot
          </Button>
        </a>
      </div>
    </nav>
  );
}

/* ─── Dashboard mock card (hero right side) ─── */
function DashboardMock() {
  const matches = [
    { name: "ABSA Foundation", areas: "Education · Youth · Skills", score: 87 },
    { name: "DG Murray Trust", areas: "Education · Community Dev", score: 94 },
    { name: "Anglo American", areas: "Youth · Environment · Health", score: 81 },
  ];
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-[0_24px_48px_-12px_hsl(var(--foreground)/0.12)]">
        <div className="flex items-center justify-between mb-5">
          <span className="text-[11px] font-semibold text-muted-foreground tracking-[0.12em]">FIND THE GRANT · DASHBOARD</span>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <div className="h-2.5 w-2.5 rounded-full bg-accent-amber" />
            <div className="h-2.5 w-2.5 rounded-full bg-success" />
          </div>
        </div>
        <p className="text-sm font-medium text-foreground mb-4">Good morning, Thandiwe</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { v: "47", l: "Matches" },
            { v: "$1.2M", l: "Pipeline" },
            { v: "89%", l: "Avg Match" },
          ].map((s) => (
            <div key={s.l} className="bg-secondary rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-foreground">{s.v}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.12em] mb-3">TOP MATCHES FOR YOU</p>
        <div className="space-y-2">
          {matches.map((m) => (
            <div key={m.name} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
              <div>
                <div className="text-sm font-semibold text-foreground">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{m.areas}</div>
              </div>
              <span className="text-sm font-bold text-success">{m.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Live ticker ─── */
function LiveTicker() {
  const items = [
    { name: "ABSA Foundation", open: true, cat: "SA Corporate" },
    { name: "DG Murray Trust", open: true, cat: "SA Trusts" },
    { name: "Anglo American Foundation", open: false, cat: "SA Corporate" },
    { name: "Allan Gray Orbis", open: true, cat: "SA Trusts" },
    { name: "Bill & Melinda Gates", open: true, cat: "USA" },
    { name: "Nedbank Foundation", open: false, cat: "SA Corporate" },
    { name: "Ford Foundation", open: true, cat: "USA" },
    { name: "Open Society Foundations", open: true, cat: "USA" },
    { name: "Standard Bank Foundation", open: false, cat: "SA Corporate" },
    { name: "Hivos", open: true, cat: "Europe" },
  ];
  const doubled = [...items, ...items];
  return (
    <section className="relative border-y border-border bg-secondary overflow-hidden">
      <p className="text-center text-[11px] font-semibold text-primary tracking-[0.18em] pt-3 uppercase">
        Live funding opportunities from the database
      </p>
      <div className="py-4 animate-ticker flex whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm text-muted-foreground">
            <span className={`h-2 w-2 rounded-full ${item.open ? "bg-success" : "bg-accent-amber"}`} />
            <span className="font-semibold text-foreground">{item.name}</span>
            <span>·</span>
            <span>{item.open ? "Open Now" : "Opens Soon"}</span>
            <span>·</span>
            <span>{item.cat}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

/* ─── Section header ─── */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-primary tracking-[0.18em] uppercase mb-4">{children}</p>;
}

/* ─── Waitlist form ─── */
function WaitlistForm({ onSuccess }: { onSuccess: (d: { name: string; email: string; position: number }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [org, setOrg] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [role, setRole] = useState("Executive Director");
  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committed) {
      toast({ title: "Please confirm your commitment", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { count } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
      const position = 7 + (count || 0) + 1;
      const { error } = await supabase.from("waitlist").insert({
        email, name, organisation: org, country, role, committed_to_pay: committed, position,
      });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "You are already on the waitlist.", description: "Check your email for confirmation." });
        } else {
          throw error;
        }
        setSubmitting(false);
        return;
      }
      onSuccess({ name, email, position });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const countries = ["South Africa", "Nigeria", "Kenya", "Ghana", "Tanzania", "Uganda", "Ethiopia", "Rwanda", "Zimbabwe", "Mozambique", "Senegal", "Cameroon", "Malawi", "Zambia", "Botswana", "Namibia", "Other"];
  const roles = ["Executive Director", "Programme Manager", "Fundraiser", "Finance", "Other"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-xl font-bold text-foreground mb-1">Reserve your founding member spot</h3>
      <div>
        <Label htmlFor="waitlist-name" className="text-xs font-medium text-muted-foreground">Your name</Label>
        <Input id="waitlist-name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" placeholder="Full name" />
      </div>
      <div>
        <Label htmlFor="waitlist-email" className="text-xs font-medium text-muted-foreground">Work email address</Label>
        <Input id="waitlist-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" placeholder="you@organisation.org" />
      </div>
      <div>
        <Label htmlFor="waitlist-org" className="text-xs font-medium text-muted-foreground">Organisation name</Label>
        <Input id="waitlist-org" name="organization" autoComplete="organization" value={org} onChange={(e) => setOrg(e.target.value)} required className="mt-1" placeholder="Your NGO name" />
      </div>
      <div>
        <Label htmlFor="waitlist-country" className="text-xs font-medium text-muted-foreground">Country</Label>
        <select id="waitlist-country" name="country" autoComplete="country-name" value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-md bg-background border border-input text-foreground text-sm px-3 py-2">
          {countries.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <Label htmlFor="waitlist-role" className="text-xs font-medium text-muted-foreground">Your role</Label>
        <select id="waitlist-role" name="role" autoComplete="organization-title" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-md bg-background border border-input text-foreground text-sm px-3 py-2">
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="commit" checked={committed} onChange={(e) => setCommitted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-input accent-primary" />
        <span className="text-xs text-muted-foreground">I commit to paying $47/month when Find The Grant launches. (No charge until launch day.)</span>
      </label>
      <Button type="submit" disabled={submitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base py-4 rounded-xl h-auto">
        {submitting ? <AfricaSpinner className="h-4 w-4 animate-spin mr-2" /> : null}
        Claim my founding member spot →
      </Button>
    </form>
  );
}

function WaitlistSuccess({ data }: { data: { name: string; email: string; position: number } }) {
  const shareText = `I just joined the Find The Grant waitlist. It is an AI tool that finds funders for African NGOs and writes the grant proposals. Launching soon at $47/month. Join here: ${window.location.origin}`;
  return (
    <div className="text-center py-8">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-xl font-bold text-foreground mb-2">You're on the list, {data.name}!</h3>
      <p className="text-muted-foreground mb-1">You are founding member <span className="text-primary font-bold">#{data.position}</span></p>
      <p className="text-sm text-muted-foreground/80 mb-6">We will email you at {data.email} when Find The Grant is ready to launch.</p>
      <p className="text-xs text-muted-foreground mb-4">In the meantime, tell another NGO:</p>
      <div className="flex flex-col gap-2">
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" className="w-full">Share on WhatsApp</Button>
        </a>
        <Button variant="outline" className="w-full" onClick={() => { navigator.clipboard.writeText(window.location.origin); toast({ title: "Link copied!" }); }}>
          <Copy className="h-3 w-3 mr-2" /> Copy my referral link
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/70 mt-4">Every NGO you refer moves you 3 spots up the queue.</p>
    </div>
  );
}

/* ─── Main Page ─── */
const LandingPage = () => {
  const BASE_COUNT = 17;
  const [waitlistCount, setWaitlistCount] = useState(BASE_COUNT);
  const [successData, setSuccessData] = useState<{ name: string; email: string; position: number } | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    supabase.from("waitlist").select("*", { count: "exact", head: true }).then(({ count }) => {
      setWaitlistCount(Math.max(BASE_COUNT, BASE_COUNT + (count || 0)));
    });
  }, []);

  const tabs = [
    {
      label: "Match Engine",
      copy: "Discover your highest-probability matches in seconds. Our algorithm scores all funders against your mission, showing you exactly who is most likely to fund you.",
      image: previewMatchEngine,
    },
    {
      label: "Proposal Writer",
      copy: "AI-powered proposal generation. Full proposals, letters of enquiry, concept notes. Generated from your profile in minutes. Reviewed by you. Ready to submit.",
      image: previewProposalWriter,
    },
    {
      label: "Pipeline",
      copy: "Kanban board, deadline calendar, funder relationship history. Track every application from discovery to submission. Know exactly where you stand.",
      image: previewPipeline,
    },
  ];

  const founders = [
    {
      name: "Nick Fernandes, PhD",
      title: "Co-Founder · Clinical Psychologist & Strategist",
      img: founderNick,
      bio: "Clinical psychologist, strategist, and founder of six NGOs focused on education, youth development, and mental health across Africa. With a PhD in psychology and extensive field experience, Nick brings a deep understanding of human systems and scalable social impact. He is known for designing community-rooted strategies that are both trauma-informed and results-oriented.",
    },
    {
      name: "Chantal Ehlen",
      title: "Co-Founder · Project Strategist & Operations Coach",
      img: founderChantal,
      bio: "Project strategist and operations coach with over 20 years of experience across corporate, startup, nonprofit, and research environments. Chantal brings the strategic clarity of the corporate world together with the agility of startups and the purpose-driven focus of NGOs. She specializes in building operational systems and developing strategic frameworks.",
    },
  ];

  const faqs = [
    { q: "Is this another tool that doesn't understand African funders?", a: "No. Find The Grant is built specifically for African NGOs by people who have run them. Our funder database is weighted heavily toward Africa-active funders — local trusts, corporate foundations, and international funders with active African portfolios." },
    { q: "What if I only need help with one proposal?", a: "You can use Find The Grant for a single application — but most NGOs find that the matching engine, deadline tracking, and proposal writer pay for themselves many times over across a year." },
    { q: "Is my organisation data safe?", a: "Yes. Your profile and proposals are private to your organisation. We do not share, sell, or expose your data to other users or funders without your action." },
    { q: "How is this different from just Googling for grants?", a: "Google returns lists. Find The Grant matches funders to your specific mission, programme areas, geography, and budget — then ranks them by likelihood of funding you. Plus we track deadlines, draft proposals, and manage your pipeline." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel any time, no questions asked. Founding members keep the $47/month rate for life as long as they remain subscribed." },
    { q: "Do you cover funders outside South Africa?", a: "Yes. Our database covers funders active across the African continent, plus major international funders (USA, UK, Europe) with African portfolios." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav waitlistCount={waitlistCount} />

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6 lg:px-12 overflow-hidden">
        {/* soft decorative shapes (top-right) */}
        <div className="absolute top-20 right-0 w-[420px] h-[420px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-32 w-32 h-32 rounded-full bg-accent-amber/15 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0)}>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-sm font-semibold mb-6">
              <Globe className="h-3.5 w-3.5" /> Built for African NGOs
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Find your funders<br />
              <span className="text-primary">in seconds.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Find The Grant instantly connects your mission to a growing database of active funders across Africa and beyond. Discover your highest-probability matches, and let AI help you write the proposals.
            </p>
            <a href="#pricing">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base px-7 py-6 h-auto shadow-md">
                Claim your spot: $47/month at launch <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <div className="mt-4">
              <Link to="/login">
                <Button variant="outline" size="lg" className="rounded-xl text-base px-7 py-5 h-auto border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50">
                  Already have access? Log In
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 mt-5 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <AnimatedCounter end={waitlistCount} className="text-foreground font-semibold" /> NGOs already waiting
            </div>
            <p className="text-xs text-muted-foreground/80 mt-4 max-w-md">
              Lock in your price before we launch. Get 7 days free access at launch. Cancel any time. No charge until launch day.
            </p>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={fadeUp(0.2)}>
            <DashboardMock />
          </motion.div>
        </div>
      </section>

      <LiveTicker />

      {/* ─── The Problem ─── */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <SectionEyebrow>The Problem</SectionEyebrow>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            African NGOs do incredible work.<br />
            And spend half their time lost in the funding maze.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            There is a better way. And you shouldn't need a full-time fundraiser to access it.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { stat: "47 hours", label: "Average time spent researching funders per application", body: "Your programme staff are grant writers by default. Every hour on funder research is an hour not spent in the community." },
              { stat: "1 in 5", label: "Applications succeed on average for African NGOs", body: "The odds are brutal. Not because your work isn't good enough. Because most proposals don't show it clearly." },
              { stat: "$2.4M", label: "Average funding gap African NGOs report annually", body: "The money is out there. Hundreds of funders are actively accepting applications right now. Most NGOs never find them in time." },
            ].map((s) => (
              <div key={s.stat} className="bg-card border border-border rounded-2xl p-7 text-left shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl font-bold text-primary mb-2">{s.stat}</div>
                <div className="text-sm font-semibold text-foreground mb-3">{s.label}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Solution ─── */}
      <section className="py-24 px-6 lg:px-12 bg-secondary">
        <div className="max-w-5xl mx-auto text-center">
          <SectionEyebrow>The Solution</SectionEyebrow>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Find The Grant does the heavy lifting.<br />You focus on the work.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            Match with the right funders. Write proposals that win. Track everything in one place. In a fraction of the time.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { t: "Find your funders in seconds", b: "Tell us your mission once. Find The Grant scores all funders against your profile and surfaces the ones most likely to fund you. No more digging through PDF lists." },
              { t: "AI writes your proposals", b: "Full proposals, letters of enquiry, concept notes. Generated in minutes from your profile. Reviewed by you. Submitted when you're ready." },
              { t: "Track every application", b: "Kanban pipeline, deadline calendar, funder relationship history. Know exactly where every application stands and what to do next." },
            ].map((s) => (
              <div key={s.t} className="bg-card border border-border rounded-2xl p-7 shadow-sm">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Check className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── See It In Action ─── */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <SectionEyebrow>See It In Action</SectionEyebrow>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-12">
            Built for the way African NGOs actually work.
          </h2>
          <div className="flex justify-center gap-2 mb-10">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === i ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 lg:p-10 shadow-sm">
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">{tabs[activeTab].copy}</p>
            <div className="mt-8 aspect-video rounded-xl border border-border overflow-hidden bg-secondary">
              <img
                src={tabs[activeTab].image}
                alt={`${tabs[activeTab].label} preview`}
                className="w-full h-full object-cover"
                loading="lazy"
                width={1280}
                height={800}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 px-6 lg:px-12 bg-secondary">
        <div className="max-w-5xl mx-auto text-center">
          <SectionEyebrow>Get Started In Minutes</SectionEyebrow>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-16">
            From signup to your first matched grant in under 10 minutes.
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { n: "01", t: "Complete your profile once", b: "Tell us about your organisation, your mission, your programmes, and who you serve. Our guided onboarding takes 10-15 minutes and powers everything after it." },
              { n: "02", t: "See your matched funders", b: "Find The Grant scores all funders against your profile instantly. You see the ones most likely to fund you, ranked by match score, with application windows clearly shown." },
              { n: "03", t: "Write and submit with AI", b: "Click apply on any funder. Find The Grant reads their requirements and opens the right document type. Full proposal, letter of enquiry, or concept note, generated and ready to review." },
            ].map((s) => (
              <div key={s.n} className="bg-card border border-border rounded-2xl p-7 shadow-sm">
                <div className="text-sm font-bold text-primary mb-3">{s.n}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-10">
            Average time from signup to first proposal draft: <span className="font-semibold text-foreground">23 minutes</span>. (We timed it.)
          </p>
        </div>
      </section>

      {/* ─── Founders ─── */}
      <section id="founders" className="py-24 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto text-center">
          <SectionEyebrow>Meet The Founders</SectionEyebrow>
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Built by people who have lived it.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-16">
            Decades of experience across psychology, NGO leadership, and operational strategy — channelled into one tool for African changemakers.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-left">
            {founders.map((f) => (
              <div key={f.name} className="bg-card border border-border rounded-2xl p-8 shadow-sm">
                <img src={f.img} alt={f.name} className="h-24 w-24 rounded-full object-cover mb-5 ring-4 ring-primary/10" />
                <h3 className="text-xl font-bold text-foreground mb-1">{f.name}</h3>
                <p className="text-sm font-semibold text-primary mb-4">{f.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 px-6 lg:px-12 bg-secondary">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <SectionEyebrow>Frequently Asked Questions</SectionEyebrow>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight">Questions we hear a lot.</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q${i}`} className="bg-card border border-border rounded-xl px-6 shadow-sm">
                <AccordionTrigger className="text-left text-base font-semibold text-foreground hover:no-underline py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── Pricing / Waitlist ─── */}
      <section id="pricing" className="py-24 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <SectionEyebrow>Join The Waitlist</SectionEyebrow>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              Lock in $47/month before we launch.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              After launch, pricing starts at $99/month. Waitlist members who commit now keep $47/month for life. That is our promise.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Plan card */}
            <div className="bg-card border-2 border-primary rounded-2xl p-8 shadow-md">
              <div className="inline-block text-xs font-bold text-primary-foreground bg-primary px-3 py-1 rounded-full mb-4">
                Founding Member
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-5xl font-bold text-foreground">$47</span>
                <span className="text-muted-foreground">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">(for life, locks in at launch)</p>
              <ul className="space-y-3">
                {[
                  "Unlimited grant applications",
                  "Full funder database with match scores",
                  "AI proposal writer (full proposals, LOEs, concept notes)",
                  "Application pipeline & Kanban",
                  "Deadline intelligence engine",
                  "Impact report generator",
                  "Funder relationship CRM",
                  "NGO Partnership Hub",
                  "Analytics dashboard",
                  "Priority support at launch",
                  "Founding member badge",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-6 pt-6 border-t border-border">
                vs <span className="line-through">$99/month</span> after launch
              </p>
            </div>

            {/* Form */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              {successData ? <WaitlistSuccess data={successData} /> : <WaitlistForm onSuccess={setSuccessData} />}
            </div>
          </div>

          <p className="text-center text-sm text-accent-amber mt-10">
            ⚡ Only founding member pricing available until launch. Price goes to $99/month after launch.
          </p>
          <p className="text-center text-sm text-muted-foreground mt-3">
            🟢 <AnimatedCounter end={waitlistCount} className="text-foreground font-semibold" /> people on the waitlist
          </p>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 px-6 lg:px-12 bg-secondary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Your next grant is already in the database.
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Thousands of funders. Hundreds accepting applications right now. Your match score calculated in seconds.
          </p>
          <a href="#pricing">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-base px-8 py-6 h-auto shadow-md">
              Claim your founding member spot <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
          <p className="text-xs text-muted-foreground mt-5">
            No charge until launch. Cancel any time. $47/month for life if you join now.
          </p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="outline" className="rounded-xl text-sm px-6 py-3 h-auto border border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50">
                Already have access? Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-10 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Wordmark size="text-lg" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Find The Grant. Built for African NGOs.</p>
          <Link
            to="/login"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            Team login
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
