"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

function NavItemComponent({ href, icon, label, isCollapsed = false, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      title={isCollapsed ? label : undefined}
      onClick={onClick}
      className={`
        flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-2 py-2 rounded-md transition-all duration-fast
        ${isActive 
          ? 'bg-bg-tertiary text-text-primary border-l-[3px] border-text-accent pl-[7px]' 
          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
        }
      `}
      aria-label={label}
    >
      <span className="text-2xl">{icon}</span>
      {!isCollapsed && <span className="text-base font-medium">{label}</span>}
    </Link>
  );
}

export const NavItem = memo(NavItemComponent);
