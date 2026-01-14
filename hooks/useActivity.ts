import { useContext } from "react";
import { ActivityContext } from "@/components/providers/ActivityProvider";
import { ActivityContextValue } from "@/lib/types";

export function useActivity(): ActivityContextValue {
  const context = useContext(ActivityContext);
  
  if (!context) {
    throw new Error("useActivity must be used within an ActivityProvider");
  }
  
  return context;
}
