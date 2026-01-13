import dynamic from "next/dynamic";
import { LibrarianSkeleton } from "@/components/librarian/LibrarianSkeleton";

const LibrarianView = dynamic(
  () => import("@/components/librarian/LibrarianView").then((mod) => ({ default: mod.LibrarianView })),
  {
    loading: () => <LibrarianSkeleton />,
    ssr: false,
  }
);

export const metadata = {
  title: "The Librarian's Home | Prompt Library",
  description:
    "Cultivate your prompts, grow your library, and watch your ideas flourish in The Librarian's Home",
};

export default function LibrarianPage() {
  return <LibrarianView />;
}
