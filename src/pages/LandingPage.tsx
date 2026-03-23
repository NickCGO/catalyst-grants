import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Target, PenTool, Shield, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleBackground from "@/components/ParticleBackground";
import GlassCard from "@/components/GlassCard";
import AnimatedCounter from "@/components/AnimatedCounter";
import MatchScoreRing from "@/components/MatchScoreRing";
import FunderCard from "@/components/FunderCard";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const tickerItems = [
  { name: "National Lotteries Commission", category: "SA Trusts" },
  { name: "DG Murray Trust", category: "SA Trusts" },
  { name: "Anglo American Chairman's Fund", category: "SACorp" },
  { name: "Ford Foundation", category: "USA" },
  { name: "Open Society Foundation", category: "USA" },
  { name: "Comic Relief", category: "United Kingdom" },
  { name: "Nedbank Foundation", category: "SACorp" },
  { name: "Standard Bank Foundation", category: "SACorp" },
  { name: "Hivos", category: "Europe" },
  { name: "Irish Aid", category: "Foreign Missions" },
  { name: "ABSA Foundation", category: "SACorp" },
  { name: "Raith Foundation", category: "SA Trusts" },
];

const steps = [
  {
    icon: Users,
    title: "Complete your profile",
    desc: "Tell us your mission, focus areas, geography, and programmes",
  },
  {
    icon: Target,
    title: "Get matched instantly",
    desc: "AI scores every funder against your profile (0–100 match score)",
  },
  {
    icon: PenTool,
    title: "Write & submit with AI",
    desc: "Generate full proposals in minutes, review, and track outcomes",
  },
];

const featuredFunders = [
  {
    name: "Anglo American Chairman's Fund",
    category: "SACorp",
    focusAreas: ["Education", "Youth", "Community Development", "Health"],
    applicationPeriod: "Monthly",
    geography: "National",
    method: "Proposal",
    matchScore: 91,
    isOpen: true,
  },
  {
    name: "DG Murray Trust",
    category: "SA Trusts/ Foundations",
    focusAreas: ["Education", "Youth", "Capacity Building", "Research"],
    applicationPeriod: "Open year-round",
    geography: "National",
    method: "Concept Note",
    matchScore: 85,
    isOpen: true,
  },
  {
    name: "Ford Foundation",
    category: "USA",
    focusAreas: ["Human Rights", "Gender", "Economic Justice"],
    applicationPeriod: "By invitation",
    geography: "International",
    method: "Letter of Enquiry",
    matchScore: 72,
    isOpen: false,
  },
];

const testimonials = [
  {
    quote: "GrantMatch helped us discover 47 funders we didn't know existed. We secured R2.1 million in new funding within 6 months.",
    name: "Thandi Mbeki",
    org: "Ubuntu Youth Foundation",
    role: "Executive Director",
  },
  {
    quote: "The AI proposal writer saved our team hundreds of hours. Our success rate went from 12% to 38% in one year.",
    name: "James Okafor",
    org: "West Africa Education Trust",
    role: "Grants Manager",
  },
  {
    quote: "Finally, a platform that understands African NGOs. The funder matching is incredibly accurate.",
    name: "Sarah Ndlovu",
    org: "Langa Community Care",
    role: "Founder",
  },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col">
        <ParticleBackground />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">GrantMatch</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#funders" className="hover:text-foreground transition-colors">Funders</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get started <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-6"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Find the funding your{" "}
              <span className="text-gradient-blue">mission deserves.</span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              GrantMatch connects African NGOs to 2,400+ funders with AI-powered matching,
              proposal writing, and application tracking — all in one platform.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Link to="/signup">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 text-base">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary px-8 text-base">
                  See how it works
                </Button>
              </a>
            </motion.div>

            <motion.div
              className="flex flex-col sm:flex-row gap-6 justify-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="glass-card-static px-6 py-3 inline-flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-foreground font-semibold">
                  R<AnimatedCounter end={247} suffix="M+" className="text-foreground font-bold" />
                </span>
                <span className="text-muted-foreground">in grants available</span>
              </div>
              <div className="glass-card-static px-6 py-3 inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-foreground font-semibold">
                  <AnimatedCounter end={2448} className="text-foreground font-bold" />
                </span>
                <span className="text-muted-foreground">active funders</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <section className="relative z-10 border-y border-border/30 bg-secondary/30 overflow-hidden py-3">
        <div className="animate-ticker flex whitespace-nowrap">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2 mx-6 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="font-medium text-foreground">{item.name}</span>
              <span>·</span>
              <span>Open Now</span>
              <span>·</span>
              <span>{item.category}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { value: 2448, label: "Funders in database", suffix: "" },
            { value: 25, label: "Focus area categories", suffix: "" },
            { value: 312, label: "Currently accepting applications", suffix: "" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <GlassCard className="text-center py-8">
                <div className="text-4xl font-bold text-foreground mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Three steps to your next grant. Simple, fast, intelligent.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <GlassCard className="text-center h-full" glowColor="blue">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-xs font-mono text-primary mb-3">Step {i + 1}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Funders */}
      <section id="funders" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Featured funding opportunities
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Real funders from our database of 2,400+. Start matching today.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredFunders.map((f, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <FunderCard {...f} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by NGOs across Africa
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <GlassCard className="h-full flex flex-col">
                  <p className="text-sm text-muted-foreground italic mb-6 flex-1">"{t.quote}"</p>
                  <div>
                    <div className="text-sm font-semibold text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}, {t.org}</div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to find your next grant?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join hundreds of African NGOs already using GrantMatch.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 text-base">
              Start matching <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/30 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">GrantMatch</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>© 2026 GrantMatch. All rights reserved.</span>
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Powered by AI
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
