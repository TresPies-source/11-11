import type { Metadata } from "next";
import "./globals.css";
import { MockSessionProvider } from "@/components/providers/MockSessionProvider";
import { RepositoryProvider } from "@/components/providers/RepositoryProvider";
import { ContextBusProvider } from "@/components/providers/ContextBusProvider";
import { SyncStatusProvider } from "@/components/providers/SyncStatusProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = storedTheme || (prefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>
            <ContextBusProvider>
              <MockSessionProvider>
                <SyncStatusProvider>
                  <RepositoryProvider>
                    {children}
                  </RepositoryProvider>
                </SyncStatusProvider>
              </MockSessionProvider>
            </ContextBusProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
