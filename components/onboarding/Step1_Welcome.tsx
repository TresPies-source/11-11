"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, BookOpen, Shield } from "lucide-react";

interface Step1_WelcomeProps {
  onNext: () => void;
}

export function Step1_Welcome({ onNext }: Step1_WelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-6 space-y-6"
    >
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#e8873e] via-[#f39c5a] to-[#f5a623] animate-pulse">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-text-primary">
            Welcome to Dojo Genesis
          </h3>
          <p className="text-text-secondary max-w-md mx-auto">
            Your Sustainable Intelligence Platform for thoughtful, deliberate
            creation
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-tertiary/50 border border-bg-tertiary">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-dojo/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-dojo" />
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Think with AI, not for you
            </h4>
            <p className="text-sm text-text-secondary">
              We empower your thinking process rather than replacing it
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-tertiary/50 border border-bg-tertiary">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-librarian/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-librarian" />
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Global Commons
            </h4>
            <p className="text-sm text-text-secondary">
              Access and share prompts in a collaborative knowledge base
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-bg-tertiary/50 border border-bg-tertiary">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-debugger/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-debugger" />
          </div>
          <div>
            <h4 className="font-semibold text-text-primary mb-1">
              Transparent & Trustworthy
            </h4>
            <p className="text-sm text-text-secondary">
              Real-time agent activity and clear cost tracking
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          className={cn(
            "px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
            "text-white bg-text-accent hover:bg-opacity-90",
            "focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-bg-secondary",
            "transform hover:scale-105"
          )}
        >
          Let&apos;s Begin
        </button>
      </div>
    </motion.div>
  );
}
