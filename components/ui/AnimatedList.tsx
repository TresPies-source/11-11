"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {children.map((child, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
              delay: index * 0.05,
            }}
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  index?: number;
}

export function AnimatedListItem({ children, index = 0 }: AnimatedListItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        delay: index * 0.05,
      }}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({ 
  children, 
  className,
  staggerDelay = 0.05 
}: StaggeredListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
