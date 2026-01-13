import { useContext } from "react";
import { FileTreeContext, FileTreeContextValue } from "@/components/providers/FileTreeProvider";

export function useFileTree(): FileTreeContextValue {
  const context = useContext(FileTreeContext);
  
  if (!context) {
    throw new Error("useFileTree must be used within a FileTreeProvider");
  }
  
  return context;
}
