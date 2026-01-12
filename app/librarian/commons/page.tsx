import { CommonsView } from "@/components/librarian/CommonsView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Commons - 11-11",
  description: "Discover prompts shared by the community",
};

export default function CommonsPage() {
  return <CommonsView />;
}
