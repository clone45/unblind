'use client';

import { useState, useEffect, useCallback } from 'react';
import { DiagramCanvas } from '@/types/canvas';

export const useCanvas = (width: number = 800, height: number = 600) => {
  const [canvas, setCanvas] = useState<DiagramCanvas | null>(null);
  const [, forceUpdate] = useState({});

  // Initialize canvas
  useEffect(() => {
    const newCanvas = new DiagramCanvas(width, height);
    setCanvas(newCanvas);
  }, [width, height]);

  // Force re-render when canvas changes
  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);

  // Update canvas size when container size changes
  const updateCanvasSize = useCallback((newWidth: number, newHeight: number) => {
    if (canvas) {
      canvas.setViewportSize(newWidth, newHeight);
      refresh();
    }
  }, [canvas, refresh]);

  return {
    canvas,
    refresh,
    updateCanvasSize,
    nodes: canvas?.getAllNodes() || [],
    connectors: canvas?.getAllConnectors() || [],
    viewport: canvas?.getViewport() || { zoom: 1, panX: 0, panY: 0, width, height }
  };
};