import { useState, useCallback } from "react";
import { ConfirmAction } from "@/components/editor/ConfirmDialog";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  resolve: ((action: ConfirmAction) => void) | null;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    resolve: null,
  });

  const showConfirmDialog = useCallback(
    (title: string, message: string): Promise<ConfirmAction> => {
      return new Promise((resolve) => {
        setState({
          isOpen: true,
          title,
          message,
          resolve,
        });
      });
    },
    []
  );

  const handleAction = useCallback(
    (action: ConfirmAction) => {
      if (state.resolve) {
        state.resolve(action);
      }
      setState({
        isOpen: false,
        title: "",
        message: "",
        resolve: null,
      });
    },
    [state.resolve]
  );

  return {
    dialogProps: {
      isOpen: state.isOpen,
      title: state.title,
      message: state.message,
      onAction: handleAction,
    },
    showConfirmDialog,
  };
}
