"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Scale,
  Users,
  Shield,
  Zap,
  FileText,
  BarChart3,
  ArrowRight,
  Sparkles,
  Gavel,
  Menu,
  X,
  Sun,
  Moon,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Footer,
  FooterContent,
  FooterColumn,
} from "@/components/ui/footer";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/landing-navbar";
import ParticlesBackground from "@/components/ParticlesBackground";

// ── Data ──────────────────────────────────────────────────────────────

const navItems = [
  { name: "Features", link: "#features" },
  { name: "How It Works", link: "#how-it-works" },
  { name: "Testimonials", link: "#testimonials" },
  { name: "Pricing", link: "#cta" },
];

const features = [
  { icon: Scale, title: "AI Case Analysis", desc: "Upload briefs, depositions, and exhibits. Receive instant AI-generated findings across facts, witnesses, evidence, and strategic risks." },
  { icon: Users, title: "Jury Intelligence", desc: "Simulate 12-person jury panels by jurisdiction. Predict votes, identify biases, and receive tailored voir dire recommendations." },
  { icon: Shield, title: "Enterprise Security", desc: "End-to-end encryption, SOC 2 Type II compliant infrastructure, and strict data isolation per matter." },
  { icon: Zap, title: "Instant Insights", desc: "From document upload to full case analysis in minutes — not days. Stay ahead of discovery deadlines and trial prep timelines." },
  { icon: FileText, title: "Document Intelligence", desc: "Automatic extraction of key facts, legal citations, party positions, and timeline events from any uploaded document." },
  { icon: BarChart3, title: "Strategy Reports", desc: "Export comprehensive strategy memos and jury analysis reports formatted for partner review or client presentation." },
];

const steps = [
  { num: "01", title: "Create a Case", desc: "Name your matter and set the jurisdiction, parties, and expected trial date." },
  { num: "02", title: "Upload Documents", desc: "Drag and drop complaints, depositions, exhibits, contracts, and expert reports." },
  { num: "03", title: "Run AI Analysis", desc: "LexAI extracts facts, identifies legal arguments, summarizes evidence, and flags strategic risks automatically." },
  { num: "04", title: "Simulate Your Jury", desc: "Model a 12-person jury for your venue and receive strategic recommendations before trial." },
];

const testimonials = [
  { quote: "LexAI changed how our trial team prepares. The jury simulation alone saved us 40 hours of manual research on our last verdict.", name: "Margaret Osei", title: "Senior Trial Partner, Osei & Vance LLP" },
  { quote: "The AI case analysis uncovered weaknesses in opposing counsel's strategy that our team had overlooked.", name: "Daniel Brooks", title: "Litigation Counsel, Brooks Legal Group" },
  { quote: "Preparing for voir dire used to take days. With LexAI we generated tailored juror insights in minutes.", name: "Sophia Martinez", title: "Managing Partner, Martinez Trial Attorneys" },
  { quote: "The most thoughtful legal AI product I have seen. It respects the complexity of litigation instead of oversimplifying it.", name: "Dr. Fatima Nwosu", title: "Legal Innovation Director, Stanton & Clough" },
];

// ── Logo ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <a href="/" className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
        L
      </div>
      <span className="font-semibold text-foreground">LexAI</span>
    </a>
  );
}

// ── Dashboard Image ────────────────────────────────────────────────────

function DashboardPreview() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Always show light image during SSR to avoid flash; swap after mount
  const src = !mounted || resolvedTheme === "light" ? "/dashboard.png" : "/dark_dashboard.png";

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7 }}
        className="relative rounded-xl border border-border/40 bg-gradient-to-b from-background to-muted/30 p-2 shadow-2xl"
      >
        <img
          src={src}
          alt="LexAI Dashboard"
          width={1200}
          height={675}
          className="rounded-lg w-full h-auto"
          loading="lazy"
        />
      </motion.div>
    </section>
  );
}

// ── Theme Toggle ───────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-border/60 hover:bg-accent transition-colors shrink-0"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <ParticlesBackground />

      <Navbar>
        <NavBody>
          <Logo />
          <NavItems items={navItems} />
          <div className="relative z-20 flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <Logo />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} />
          </MobileNavHeader>
          <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
            {navItems.map((item) => (
              <a key={item.name} href={item.link} onClick={() => setMobileOpen(false)} className="w-full py-2 text-sm">
                {item.name}
              </a>
            ))}
            <NavbarButton href="/login" className="w-full" variant="secondary">
              Sign in
            </NavbarButton>
            <NavbarButton href="/signup" className="w-full" variant="gradient">
              Get Started
            </NavbarButton>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main>
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 pt-28 pb-16 text-center overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Now in private beta — 50+ firms onboarded
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.1]"
          >
            AI-powered litigation strategy{" "}
            <span className="text-primary">built for trial lawyers</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            Upload your case files. Run jury simulations. Get AI-generated strategy—
            in minutes, not days.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/60 hover:bg-accent">
                View Demo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-12 text-xs text-muted-foreground/60"
          >
            No credit card required · SOC 2 Type II certified · HIPAA compliant
          </motion.p>
        </section>

        <DashboardPreview />

        {/* ── Features ────────────────────────────────────────── */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything Your Trial Team Needs
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              LexAI combines document intelligence, predictive jury modeling, and
              strategic analysis in one secure platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="group h-full border-border/50 hover:border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader className="p-5 pb-2">
                    <div className="mb-3 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <feat.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base font-semibold">
                      {feat.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {feat.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────────── */}
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-6 py-20 bg-muted/30 border-y border-border/40"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From Upload to Strategy in Minutes
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Four simple steps from raw documents to actionable litigation strategy.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full text-center border-border/50 hover:shadow-md transition-all duration-300">
                  <CardHeader className="p-5 pb-3">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {step.num}
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <CardDescription className="text-sm leading-6">
                      {step.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────── */}
        <section id="testimonials" className="mx-auto max-w-7xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Trusted by Leading Trial Firms
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Hear from the litigation teams already using LexAI to prepare smarter.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50 hover:border-border transition-colors">
                  <CardHeader className="p-5 pb-2">
                    <span className="text-3xl leading-none text-muted-foreground/20 select-none">"</span>
                    <CardDescription className="text-sm leading-6 text-foreground/80 mt-1">
                      {t.quote}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <section id="cta" className="mx-auto max-w-7xl px-6 py-24 bg-muted/30 border-y border-border/40">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
              <Gavel className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Rethink Trial Preparation?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Join 50+ firms already using LexAI to win more cases with AI-powered
              strategy and jury intelligence.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="h-12 px-10 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  Start for Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="h-12 px-10 text-base border-border/60 hover:bg-accent">
                  Sign in to Your Account
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border/40">
        <Footer>
          <div className="container mx-auto px-6 py-12">
            <FooterContent>
              <FooterColumn>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                    L
                  </div>
                  <span className="font-semibold text-base">LexAI</span>
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  AI-powered litigation strategy, jury intelligence, and case analysis.
                </p>
              </FooterColumn>

              <FooterColumn>
                <h3 className="font-semibold text-sm mb-3 text-center sm:text-left">Product</h3>
                <ul className="space-y-2 text-center sm:text-left">
                  <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a></li>
                  <li><Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link></li>
                  <li><Link href="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Get Started</Link></li>
                </ul>
              </FooterColumn>

              <FooterColumn>
                <h3 className="font-semibold text-sm mb-3 text-center sm:text-left">Legal</h3>
                <ul className="space-y-2 text-center sm:text-left">
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Security</a></li>
                </ul>
              </FooterColumn>

              <FooterColumn>
                <h3 className="font-semibold text-sm mb-3 text-center sm:text-left">Contact</h3>
                <ul className="space-y-2 text-center sm:text-left">
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">hello@lexai.com</a></li>
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
                  <li><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Docs</a></li>
                </ul>
              </FooterColumn>
            </FooterContent>

            <div className="mt-10 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} LexAI. All rights reserved.
            </div>
          </div>
        </Footer>
      </footer>
    </>
  );
}