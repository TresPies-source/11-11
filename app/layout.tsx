import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MockSessionProvider } from "@/components/providers/MockSessionProvider";
import { RepositoryProvider } from "@/components/providers/RepositoryProvider";
import { ContextBusProvider } from "@/components/providers/ContextBusProvider";
import { SyncStatusProvider } from "@/components/providers/SyncStatusProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { FileTreeProvider } from "@/components/providers/FileTreeProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ActivityProvider } from "@/components/providers/ActivityProvider";
import { ActivityStatus } from "@/components/activity/ActivityStatus";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

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
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme-preference');
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
            <ActivityProvider>
              <ContextBusProvider>
                <MockSessionProvider>
                  <SyncStatusProvider>
                    <FileTreeProvider>
                      <RepositoryProvider>
                        {children}
                        <ActivityStatus />
                      </RepositoryProvider>
                    </FileTreeProvider>
                  </SyncStatusProvider>
                </MockSessionProvider>
              </ContextBusProvider>
            </ActivityProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
