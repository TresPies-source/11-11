"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/components/providers/MockSessionProvider";
import { OnboardingWizard } from "./OnboardingWizard";

export function OnboardingWrapper() {
  const { isAuthenticated } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      setShowOnboarding(false);
      return;
    }

    const onboardingCompleted = localStorage.getItem("onboarding_completed");
    
    if (!onboardingCompleted) {
      setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
    }
  }, [mounted, isAuthenticated]);

  const handleClose = () => {
    setShowOnboarding(false);
  };

  const handleComplete = () => {
    setShowOnboarding(false);
  };

  if (!mounted || !isAuthenticated) {
    return null;
  }

  return (
    <OnboardingWizard
      isOpen={showOnboarding}
      onClose={handleClose}
      onComplete={handleComplete}
    />
  );
}
