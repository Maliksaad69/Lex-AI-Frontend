"use client";
import { ModeToggle } from "@/components/ui/theme-changer";
import {
  Footer,
  FooterBottom,
  FooterColumn,
  FooterContent,
} from "@/components/ui/footer";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Navbar,
  NavBody,
  NavItems,
  NavbarLogo,
  NavbarButton,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
} from "@/components/ui/landing-navbar";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Moon, Sun, Brain } from "lucide-react"
import { useTheme } from "next-themes"
const navItems = [
  { name: "Home", link: "/" },
  { name: "Features", link: "#features" },
  { name: "Testimonials", link: "#testimonials" },
  { name: "Getting Started", link: "#starting" },
];

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme()


  return (
    <>
      <Navbar>

        {/* Desktop Navbar */}
        <NavBody>
          <NavbarLogo />

          <NavItems items={navItems} />



          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
                <span className="sr-only">Toggle theme</span>
              </Button>

            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </NavBody>

        {/* Mobile Navbar */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />

            <MobileNavToggle
              isOpen={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          >
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.link}
                className="w-full py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}

            <NavbarButton
              href="/login"
              className="w-full"
            >
              Login
            </NavbarButton>
          </MobileNavMenu>
        </MobileNav>

      </Navbar>

      {/* Hero Section */}
      <main className="pt-20">
        <section className="mx-auto max-w-5xl px-6 py-1 text-center">

          <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-medium text-blue-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            * Now in private beta — 50 firms onboarded
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-6 py-7 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            AI-powered litigation strategy{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              built for trial lawyers
            </span>
          </h1>

          <p className="mt-8 text-base leading-7 text-muted-foreground sm:text-xl lg:text-xl">
            Upload your case files. Run jury simulations. Get AI-generated strategy —
            <br></br>
            in minutes, not days. LexAI gives trial teams the intelligence to win.{" "}

          </p>
        </section>


        <section className="flex flex-col items-center justify-center gap-4 px-6 py-2 text-center sm:flex-row">
          <Button className="bg-blue-600 text-white hover:bg-blue-700 bg-none">
            Get Started
          </Button>
          <Button className="bg-none" variant="outline">
            View demo
          </Button>


        </section>
        <section className="mx-auto max-w-5xl px-1 pt-2 pb-1 text-center">
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            No credit card required · SOC 2 Type II certified · HIPAA compliant
          </p>
        </section>

        <section id="features" className="grid mx-auto max-w-5xl px-1 pt-2 pb-1 text-center">
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Everything Your Trial Team Needs
          </h1>


          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            LexAI combines document intelligence, predictive jury modeling, and strategic analysis in one secure platform.

          </p>
        </section>
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3">

          {/*Card 1 */}
          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                AI Case Analysis
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                Upload briefs, depositions, and exhibits. Receive instant AI-generated
                findings across facts, witnesses, evidence, and strategic risks.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                Jury Intelligence

              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                Simulate 12-person jury panels by jurisdiction. Predict votes, identify biases, and receive tailored voir dire recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                Attorney–Client Privilege
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                End-to-end encryption, SOC 2 Type II compliant infrastructure, and strict data isolation per matter.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                Instant Insights
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                From document upload to full case analysis in minutes — not days. Stay ahead of discovery deadlines and trial prep timelines.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                Document Intelligence
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                Automatic extraction of key facts, legal citations, party positions, and timeline events from any uploaded document.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm py-3">
            <CardHeader className="space-y-0 p-4 pb-1">
              <CardTitle>
                <Brain className="h-6 w-6" />
              </CardTitle>

              <CardDescription className="font-black text-lg text-black">
                Strategy Reports

              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0">
              <p className="text-sm leading-4 text-muted-foreground">
                Export comprehensive strategy memos and jury analysis reports formatted for partner review or client presentation.
              </p>
            </CardContent>
          </Card>

        </section>

        <section className="mx-auto max-w-7xl px-6 py-8 bg-gray-50 dark:bg-neutral-950">

          <h1 className="mt-2 text-3xl text-center font-bold tracking-tight">
            From upload to strategy in minutes
          </h1>

          <section className="mx-auto max-w-7xl px-6 py-16">


            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

              {/* Step 1 */}
              <Card className="p-6">
                <div className="mb-4 text-3xl font-bold text-blue-600">01</div>

                <CardTitle className="mb-3 text-lg">
                  Create a Case
                </CardTitle>

                <CardDescription className="leading-6">
                  Name your matter and set the jurisdiction, parties, and expected trial date.
                </CardDescription>
              </Card>

              {/* Step 2 */}
              <Card className="p-6">
                <div className="mb-4 text-3xl font-bold text-blue-600">02</div>

                <CardTitle className="mb-3 text-lg">
                  Upload Documents
                </CardTitle>

                <CardDescription className="leading-6">
                  Drag and drop complaints, depositions, exhibits, contracts, and expert reports.
                </CardDescription>
              </Card>

              {/* Step 3 */}
              <Card className="p-6">
                <div className="mb-4 text-3xl font-bold text-blue-600">03</div>

                <CardTitle className="mb-3 text-lg">
                  Run AI Analysis
                </CardTitle>

                <CardDescription className="leading-6">
                  LexAI extracts facts, identifies legal arguments, summarizes evidence, and flags strategic risks automatically.
                </CardDescription>
              </Card>

              {/* Step 4 */}
              <Card className="p-6">
                <div className="mb-4 text-3xl font-bold text-blue-600">04</div>

                <CardTitle className="mb-3 text-lg">
                  Simulate Your Jury
                </CardTitle>

                <CardDescription className="leading-6">
                  Model a 12-person jury for your venue and receive strategic recommendations before trial.
                </CardDescription>
              </Card>

            </div>
          </section>

        </section>

        <section id="testimonials" className="mx-auto max-w-7xl px-6 py-8">

          <h1 className="mt-2 text-3xl text-center font-bold tracking-tight">
            Everything Your Trial Team Needs
          </h1>

          <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 md:grid-cols-2 lg:grid-cols-3">

            {/* Testimonial 1 */}
            <Card className="w-full py-3">
              <CardHeader className="space-y-0 p-4 pb-1">
                <CardDescription className="text-sm leading-6 text-black">
                  “LexAI changed how our trial team prepares. The jury simulation alone
                  saved us 40 hours of manual research on our last verdict.”
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <p className="font-semibold text-black">Margaret Osei</p>
                <p className="text-sm text-muted-foreground">
                  Senior Trial Partner, Osei &amp; Vance LLP
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card className="w-full py-3">
              <CardHeader className="space-y-0 p-4 pb-1">
                <CardDescription className="text-sm leading-6 text-black">
                  “The AI case analysis uncovered weaknesses in opposing counsels
                  strategy that our team had overlooked. It became an essential part of
                  our trial preparation.”
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <p className="font-semibold text-black">Daniel Brooks</p>
                <p className="text-sm text-muted-foreground">
                  Litigation Counsel, Brooks Legal Group
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card className="w-full py-3">
              <CardHeader className="space-y-0 p-4 pb-1">
                <CardDescription className="text-sm leading-6 text-black">
                  “Preparing for voir dire used to take days. With LexAI we generated
                  tailored juror insights in minutes, giving our attorneys far greater
                  confidence before trial.”
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <p className="font-semibold text-black">Sophia Martinez</p>
                <p className="text-sm text-muted-foreground">
                  Managing Partner, Martinez Trial Attorneys
                </p>
              </CardContent>
            </Card>
            {/* Testimonial 3 */}
            <Card className="w-full py-3">
              <CardHeader className="space-y-0 p-4 pb-1">
                <CardDescription className="text-sm leading-6 text-black">
                  “The most thoughtful legal AI product I have seen. It respects the complexity of litigation instead of oversimplifying it.”
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <p className="font-semibold text-black">Dr. Fatima Nwosu</p>
                <p className="text-sm text-muted-foreground">
                  Legal Innovation Director, Stanton & Clough
                </p>
              </CardContent>
            </Card>

          </section>
        </section>

        <section id="starting" className="mx-auto max-w-7xl px-6 py-23 bg-gray-50 dark:bg-neutral-950">

          <h1 className="mt-2 text-3xl text-center font-bold tracking-tight">
            Ready to rethink trial preparation?
          </h1>
          <p className="mt-3 text-sm leading-7 text-center text-muted-foreground">
            Join 50+ firms already using LexAI to win more cases with AI-powered strategy and jury intelligence.
          </p>
          <section className="flex flex-col items-center justify-center gap-4 px-6 py-2 text-center sm:flex-row">
            <Link href="/signup">
              <Button className="bg-blue-600 text-white hover:bg-blue-800 border border-gray-300 bg-none">
                Start for Free
              </Button>
            </Link>
            <Button
              className="rounded-md bg-white text-black hover:bg-gray-100 border border-gray-300 bg-none"
            >
              Sign in to your account
            </Button>


          </section>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-8">
          <Footer className="border-t">
            <div className="container mx-auto px-6">
              <FooterContent>

                <FooterColumn>
                  <h3 className="font-semibold text-lg">LexAI</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered litigation strategy, jury intelligence, and case analysis.
                  </p>
                </FooterColumn>

                <FooterColumn>
                  <h4 className="font-semibold">Platform</h4>
                  <Link href="/features" className="text-sm hover:underline">
                    Features
                  </Link>

                  <Link href="/Testimonials" className="text-sm hover:underline">
                    Testimonials
                  </Link>
                  <Link href="/dashboard" className="text-sm hover:underline">
                    Dashboard
                  </Link>
                </FooterColumn>

                <FooterColumn>
                  <h4 className="font-semibold">Resources</h4>
                  <Link href="/docs" className="text-sm hover:underline">
                    Documentation
                  </Link>
                  <Link href="/blog" className="text-sm hover:underline">
                    Blog
                  </Link>
                  <Link href="/faq" className="text-sm hover:underline">
                    FAQ
                  </Link>
                </FooterColumn>

                <FooterColumn>
                  <h4 className="font-semibold">Company</h4>
                  <Link href="/about" className="text-sm hover:underline">
                    About
                  </Link>
                  <Link href="/contact" className="text-sm hover:underline">
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-sm hover:underline">
                    Privacy Policy
                  </Link>
                </FooterColumn>

                <FooterColumn>
                  <h4 className="font-semibold">Get Started</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your case documents and receive AI-driven litigation insights.
                  </p>
                </FooterColumn>

              </FooterContent>

              <FooterBottom>
                <p>© {new Date().getFullYear()} LexAI. All rights reserved.</p>

                <div className="flex gap-4">
                  <Link href="/terms" className="hover:underline">
                    Terms
                  </Link>
                  <Link href="/privacy" className="hover:underline">
                    Privacy
                  </Link>
                </div>
              </FooterBottom>
            </div>
          </Footer>
        </section>
      </main>
    </>
  );
}