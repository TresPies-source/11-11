import { GreenhouseView } from "@/components/librarian/GreenhouseView";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Greenhouse - 11-11",
  description: "Your cultivated prompts ready to bloom",
};

export default function GreenhousePage() {
  return <GreenhouseView />;
}
