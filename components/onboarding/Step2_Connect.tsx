"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Github, Cloud, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

interface Step2_ConnectProps {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function Step2_Connect({ onNext, onBack, onSkip }: Step2_ConnectProps) {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState<"google" | "github" | null>(
    null
  );

  const handleGoogleConnect = async () => {
    setIsConnecting("google");
    try {
      const response = await fetch("/api/auth/signin/google", {
        method: "POST",
      });
      
      if (response.ok) {
        setGoogleConnected(true);
        localStorage.setItem("google_drive_connected", "true");
      }
    } catch (error) {
      console.error("Failed to connect Google Drive:", error);
    } finally {
      setIsConnecting(null);
    }
  };

  const handleGithubConnect = async () => {
    setIsConnecting("github");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setGithubConnected(true);
      localStorage.setItem("github_connected", "true");
    } catch (error) {
      console.error("Failed to connect GitHub:", error);
    } finally {
      setIsConnecting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="p-6 space-y-6"
    >
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-text-primary">
          Connect Your Services
        </h3>
        <p className="text-text-secondary">
          Link your accounts to enable seamless integration
        </p>
      </div>

      <div className="space-y-4">
        <div
          className={cn(
            "p-4 rounded-lg border transition-all duration-200",
            googleConnected
              ? "bg-success/10 border-success"
              : "bg-bg-tertiary/50 border-bg-tertiary hover:border-text-accent"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <Cloud className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">
                  Google Drive
                </h4>
                <p className="text-xs text-text-secondary">
                  Store and sync your prompts
                </p>
              </div>
            </div>
            {googleConnected && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>
          <button
            onClick={handleGoogleConnect}
            disabled={googleConnected || isConnecting === "google"}
            className={cn(
              "w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              googleConnected
                ? "bg-success text-white cursor-default"
                : "bg-bg-elevated text-text-primary hover:bg-text-accent hover:text-white border border-bg-tertiary hover:border-text-accent",
              "focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-bg-secondary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isConnecting === "google"
              ? "Connecting..."
              : googleConnected
              ? "Connected"
              : "Connect Google Drive"}
          </button>
        </div>

        <div
          className={cn(
            "p-4 rounded-lg border transition-all duration-200",
            githubConnected
              ? "bg-success/10 border-success"
              : "bg-bg-tertiary/50 border-bg-tertiary hover:border-text-accent"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                <Github className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-text-primary">GitHub</h4>
                <p className="text-xs text-text-secondary">
                  Version control your work
                </p>
              </div>
            </div>
            {githubConnected && (
              <CheckCircle2 className="w-5 h-5 text-success" />
            )}
          </div>
          <button
            onClick={handleGithubConnect}
            disabled={githubConnected || isConnecting === "github"}
            className={cn(
              "w-full px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              githubConnected
                ? "bg-success text-white cursor-default"
                : "bg-bg-elevated text-text-primary hover:bg-text-accent hover:text-white border border-bg-tertiary hover:border-text-accent",
              "focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-bg-secondary",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isConnecting === "github"
              ? "Connecting..."
              : githubConnected
              ? "Connected"
              : "Connect GitHub"}
          </button>
        </div>
      </div>

      <div className="pt-4 border-t border-bg-tertiary">
        <p className="text-xs text-text-secondary text-center mb-4">
          You can connect these services later from settings
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-lg transition-colors inline-flex items-center gap-2",
            "text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary",
            "focus:outline-none focus:ring-2 focus:ring-text-accent"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              "text-text-secondary bg-transparent border border-bg-tertiary hover:border-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-text-accent"
            )}
          >
            Skip
          </button>
          <button
            onClick={onNext}
            className={cn(
              "px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200 inline-flex items-center gap-2",
              "text-white bg-text-accent hover:bg-opacity-90",
              "focus:outline-none focus:ring-2 focus:ring-text-accent focus:ring-offset-2 focus:ring-offset-bg-secondary",
              "transform hover:scale-105"
            )}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
