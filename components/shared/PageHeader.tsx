import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, iconClassName }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-8"
    >
      <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
        <Icon className={cn("h-8 w-8 text-text-secondary", iconClassName)} aria-hidden="true" />
        {title}
      </h1>
      <p className="text-lg text-text-secondary mt-2">
        {subtitle}
      </p>
    </motion.header>
  );
}
