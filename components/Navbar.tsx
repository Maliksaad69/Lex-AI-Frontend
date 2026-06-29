"use client";

import { usePathname } from "next/navigation";
import { Moon, Sun, Search, Bell, User, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LaunchUI from "@/components/logos/launch-ui";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  cases: "Cases",
  documents: "Documents",
  "ai-analysis": "AI Analysis",
  "jury-simulation": "Jury Simulation",
  reports: "Reports",
  settings: "Settings",
};

function breadcrumb(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => pageLabels[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1));
}

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const crumbs = breadcrumb(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      {/* Left: Logo + Breadcrumb */}
      <div className="flex items-center gap-3">
        <LaunchUI className="h-6 w-6 text-primary" />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          {crumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && (
                <span className="text-muted-foreground">/</span>
              )}
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}

    

        {/* Theme toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-9">
              <Sun className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-9 rounded-full">
              <User className="size-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
