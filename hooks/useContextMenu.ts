"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FileNode } from "@/lib/types";

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface UseContextMenuReturn {
  isOpen: boolean;
  position: ContextMenuPosition;
  targetNode: FileNode | null;
  openContextMenu: (event: React.MouseEvent, node: FileNode) => void;
  closeContextMenu: () => void;
}

export function useContextMenu(): UseContextMenuReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [targetNode, setTargetNode] = useState<FileNode | null>(null);

  const openContextMenu = useCallback((event: React.MouseEvent, node: FileNode) => {
    event.preventDefault();
    event.stopPropagation();

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = 200;
    const menuHeight = 300;

    let x = event.clientX;
    let y = event.clientY;

    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }

    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }

    x = Math.max(10, x);
    y = Math.max(10, y);

    setPosition({ x, y });
    setTargetNode(node);
    setIsOpen(true);
  }, []);

  const closeContextMenu = useCallback(() => {
    setIsOpen(false);
    setTargetNode(null);
  }, []);



  return {
    isOpen,
    position,
    targetNode,
    openContextMenu,
    closeContextMenu,
  };
}
