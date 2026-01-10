import type { Metadata } from "next";
import "./globals.css";
import { MockSessionProvider } from "@/components/providers/MockSessionProvider";
import { RepositoryProvider } from "@/components/providers/RepositoryProvider";
import { ContextBusProvider } from "@/components/providers/ContextBusProvider";
import { SyncStatusProvider } from "@/components/providers/SyncStatusProvider";

export const metadata: Metadata = {
  title: "11-11 | Sustainable Intelligence OS",
  description: "A Hardworking Workbench for prompt engineering and a Global Commons for collective intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ContextBusProvider>
          <MockSessionProvider>
            <SyncStatusProvider>
              <RepositoryProvider>
                {children}
              </RepositoryProvider>
            </SyncStatusProvider>
          </MockSessionProvider>
        </ContextBusProvider>
      </body>
    </html>
  );
}
