"use client";

import { useState } from "react";
import { NavigationSidebar } from "@/components/layout/NavigationSidebar";

interface ResizableLayoutProps {
  children: React.ReactNode;
}

export function ResizableLayout({ children }: ResizableLayoutProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isMobileNavOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}
      
      <div className="flex h-screen">
        <div className="hidden lg:flex h-full flex-1">
          <NavigationSidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        
        {/* Mobile and tablet layout */}
        <div className="flex h-full w-full lg:hidden">
          <NavigationSidebar 
            isMobileOpen={isMobileNavOpen}
            onMobileToggle={setIsMobileNavOpen}
          />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
