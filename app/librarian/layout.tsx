import { Header } from "@/components/layout/Header";

export default function LibrarianLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="flex-1">{children}</div>
    </div>
  );
}
