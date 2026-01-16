import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, iconClassName, actions }: PageHeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-6 sm:mb-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary flex items-center gap-2 sm:gap-3">
            <Icon className={cn("h-6 w-6 sm:h-8 sm:w-8 text-text-secondary", iconClassName)} aria-hidden="true" />
            {title}
          </h1>
          <p className="text-base sm:text-lg text-text-secondary mt-1.5 sm:mt-2">
            {subtitle}
          </p>
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </motion.header>
  );
}
