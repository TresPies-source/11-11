"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, LogIn, User, DollarSign } from "lucide-react";
import { WorkspaceSelector } from "@/components/shared/WorkspaceSelector";
import { SyncStatus } from "@/components/shared/SyncStatus";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useSession } from "@/components/providers/MockSessionProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, isAuthenticated } = useSession();
  const pathname = usePathname();

  const handleSignIn = () => {
    // TODO: Implement Google OAuth sign-in
  };

  const navLinks = [
    { href: "/librarian", label: "Librarian" },
    { href: "/cost-dashboard", label: "Cost Dashboard", icon: DollarSign },
  ];

  return (
    <header className="h-14 border-b border-border bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-foreground leading-none">
              11-11
            </h1>
            <p className="text-xs text-muted-foreground leading-none hidden sm:block">
              Sustainable Intelligence
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-border" />

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="h-6 w-px bg-border hidden md:block" />

        <WorkspaceSelector />
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        
        <SyncStatus />

        <div className="h-6 w-px bg-border hidden sm:block" />

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="text-right hidden md:block">
              <div className="text-sm font-medium text-foreground">
                {user.name}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
                className="rounded-full border-2 border-border"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleSignIn}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md",
              "bg-primary hover:bg-primary/90 text-white",
              "transition-colors text-sm font-medium"
            )}
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
