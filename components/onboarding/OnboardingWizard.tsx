"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Step1_Welcome } from "./Step1_Welcome";
import { Step2_Connect } from "./Step2_Connect";
import { Step3_CreateProject } from "./Step3_CreateProject";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingWizard({
  isOpen,
  onClose,
  onComplete,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen]);

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  }, [currentStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  }, [currentStep]);

  const handleComplete = useCallback(
    (projectName: string, projectDescription: string) => {
      localStorage.setItem("onboarding_completed", "true");
      console.log("Project created:", projectName, projectDescription);
      onComplete();
      onClose();
    },
    [onComplete, onClose]
  );

  const handleSkip = useCallback(() => {
    handleNext();
  }, [handleNext]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (currentStep === 1) {
          onClose();
        } else {
          const confirmClose = window.confirm(
            "Are you sure you want to exit? Your progress will be lost."
          );
          if (confirmClose) {
            onClose();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentStep, onClose]);

  if (!mounted) return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            aria-hidden="true"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-bg-secondary rounded-lg shadow-xl max-w-2xl w-full border border-bg-tertiary overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wizard-title"
            >
              <div className="flex items-center justify-between p-4 border-b border-bg-tertiary">
                <div className="flex items-center gap-3">
                  <h2
                    id="wizard-title"
                    className="text-lg font-semibold text-text-primary"
                  >
                    Welcome to Dojo Genesis
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-text-accent"
                  aria-label="Close wizard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 px-6 py-4 border-b border-bg-tertiary">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-colors duration-300",
                      step <= currentStep
                        ? "bg-text-accent"
                        : "bg-bg-tertiary"
                    )}
                    aria-label={`Step ${step}${
                      step <= currentStep ? " completed" : ""
                    }`}
                  />
                ))}
              </div>

              <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <Step1_Welcome key="step1" onNext={handleNext} />
                  )}
                  {currentStep === 2 && (
                    <Step2_Connect
                      key="step2"
                      onNext={handleNext}
                      onBack={handleBack}
                      onSkip={handleSkip}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3_CreateProject
                      key="step3"
                      onComplete={handleComplete}
                      onBack={handleBack}
                    />
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
}
