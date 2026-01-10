import type { Metadata } from "next";
import "./globals.css";
import { MockSessionProvider } from "@/components/providers/MockSessionProvider";

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
        <MockSessionProvider>
          {children}
        </MockSessionProvider>
      </body>
    </html>
  );
}
