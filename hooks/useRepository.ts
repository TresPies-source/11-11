import { useContext } from "react";
import { RepositoryContext } from "@/components/providers/RepositoryProvider";

export function useRepository() {
  const context = useContext(RepositoryContext);
  
  if (context === undefined) {
    throw new Error("useRepository must be used within a RepositoryProvider");
  }
  
  return context;
}
