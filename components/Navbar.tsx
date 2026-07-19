"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Moon, Sun, User, LogOut, LayoutDashboard } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import LaunchUI from "@/components/logos/launch-ui";
import { useAuth } from "@/contexts/auth-context";
import { fetchCase } from "@/lib/api";

const pageLabels: Record<string, string> = {
  dashboard: "Dashboard",
  cases: "Cases",
  reports: "Reports",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const { username, logout } = useAuth();

  const segments = pathname.split("/").filter(Boolean);
  const caseIdx = segments.indexOf("cases");
  const rawCaseId = caseIdx >= 0 && caseIdx + 1 < segments.length ? segments[caseIdx + 1] : null;
  const isCaseDetail = !!(rawCaseId && UUID_RE.test(rawCaseId));

  const [caseName, setCaseName] = useState<string | null>(null);

  useEffect(() => {
    if (!isCaseDetail) return;
    let cancelled = false;
    fetchCase(rawCaseId!)
      .then((c) => { if (!cancelled) setCaseName(c.caseName); })
      .catch(() => { if (!cancelled) setCaseName(null); });
    return () => { cancelled = true; };
  }, [rawCaseId, isCaseDetail]);

  const crumbs = segments.map((seg) => {
    if (pageLabels[seg]) return pageLabels[seg];
    if (UUID_RE.test(seg) && isCaseDetail) return caseName || "...";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3 min-w-0">
        <LaunchUI className="h-6 w-6 text-primary shrink-0" />
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((crumb, i) => (
            <span key={`${crumb}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <span className="text-muted-foreground shrink-0">/</span>}
              <span
                className={
                  i === crumbs.length - 1
                    ? "font-semibold text-foreground truncate"
                    : "text-muted-foreground shrink-0"
                }
              >
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 shrink-0">
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
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="size-9 rounded-full">
              <User className="size-4" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{username ?? "My Account"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Account</DropdownMenuLabel>
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}