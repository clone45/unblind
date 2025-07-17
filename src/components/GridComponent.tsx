import React from 'react';
import { GridSettings } from '@/types/canvas';

interface GridComponentProps {
  settings: GridSettings;
  width: number;
  height: number;
  zoom: number;
  panX: number;
  panY: number;
}

export const GridComponent: React.FC<GridComponentProps> = ({ 
  settings, 
  width, 
  height, 
  zoom, 
  panX, 
  panY 
}) => {
  if (!settings.enabled) return null;

  const gridSize = settings.size * zoom;
  const offsetX = (panX % gridSize + gridSize) % gridSize;
  const offsetY = (panY % gridSize + gridSize) % gridSize;

  const verticalLines = [];
  const horizontalLines = [];

  // Generate vertical lines
  for (let x = offsetX; x < width; x += gridSize) {
    verticalLines.push(
      <line
        key={`v-${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={settings.color}
        strokeWidth={0.5}
        opacity={settings.opacity}
      />
    );
  }

  // Generate horizontal lines
  for (let y = offsetY; y < height; y += gridSize) {
    horizontalLines.push(
      <line
        key={`h-${y}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={settings.color}
        strokeWidth={0.5}
        opacity={settings.opacity}
      />
    );
  }

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {verticalLines}
      {horizontalLines}
    </svg>
  );
};