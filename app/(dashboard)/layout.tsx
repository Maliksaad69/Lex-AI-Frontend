"use client";

import { useState } from "react";

import {
  Sidebar,
  SidebarBody,
  SidebarLink,
} from "@/components/ui/sidebar";
import Navbar from "@/components/Navbar";
import LaunchUI from "@/components/logos/launch-ui";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

import {
  IconLayoutDashboard,
  IconBriefcase,
  IconFileText,
  IconBrain,
  IconUsers,
  IconReportAnalytics,
  IconSettings,
} from "@tabler/icons-react";

function SidebarLogo({ open }: { open: boolean }) {
  return (
    <div className="flex items-center gap-3 pb-6 border-b border-sidebar-border">
      <LaunchUI className="h-4 w-6 shrink-0 text-primary" />
      <motion.span
        animate={{
          opacity: open ? 1 : 0,
          width: open ? "auto" : 0,
        }}
        transition={{ duration: 0.15 }}
        className="overflow-hidden whitespace-nowrap text-lg font-bold text-sidebar-foreground"
      >
        LexAI
      </motion.span>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconLayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Cases",
      href: "/cases",
      icon: <IconBriefcase className="h-5 w-5" />,
    },
    {
      label: "AI Analysis",
      href: "/ai-analysis",
      icon: <IconBrain className="h-5 w-5" />,
    },
    {
      label: "Jury Simulation",
      href: "/jury-simulation",
      icon: <IconUsers className="h-5 w-5" />,
    },
    {
      label: "Reports",
      href: "/reports",
      icon: <IconReportAnalytics className="h-5 w-5" />,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <IconSettings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-4">
          <SidebarLogo open={open} />
          <div className="flex flex-col gap-1 flex-1">
            {links.map((link) => (
              <SidebarLink key={link.label} link={link} />
            ))}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Right Side */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
