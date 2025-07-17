import React from 'react';
import { DiagramConnector, ConnectorType } from '@/types/connector';
import { Position } from '@/types/node';

interface ConnectorComponentProps {
  connector: DiagramConnector;
  startPosition: Position;
  endPosition: Position;
  visible?: boolean;
}

export const ConnectorComponent: React.FC<ConnectorComponentProps> = ({ 
  connector, 
  startPosition, 
  endPosition,
  visible = true
}) => {
  const { style, type, selected, label } = connector;

  const renderLine = () => {
    switch (type) {
      case ConnectorType.STRAIGHT:
        return (
          <line
            x1={startPosition.x}
            y1={startPosition.y}
            x2={endPosition.x}
            y2={endPosition.y}
            stroke={style.color}
            strokeWidth={style.width}
            strokeDasharray={style.dashPattern?.join(' ')}
            opacity={style.opacity}
          />
        );
      
      case ConnectorType.CURVED:
        // Simple curved line using quadratic bezier
        const midX = (startPosition.x + endPosition.x) / 2;
        const midY = (startPosition.y + endPosition.y) / 2;
        const controlY = midY - 50; // Curve upward
        
        return (
          <path
            d={`M ${startPosition.x} ${startPosition.y} Q ${midX} ${controlY} ${endPosition.x} ${endPosition.y}`}
            stroke={style.color}
            strokeWidth={style.width}
            fill="none"
            strokeDasharray={style.dashPattern?.join(' ')}
            opacity={style.opacity}
          />
        );
      
      default:
        return renderLine(); // Default to straight
    }
  };

  const renderArrow = (position: Position, isStart: boolean) => {
    const dx = endPosition.x - startPosition.x;
    const dy = endPosition.y - startPosition.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction vector
    const dirX = dx / lineLength;
    const dirY = dy / lineLength;
    
    // For end arrow, point in direction of line
    // For start arrow, point opposite to line direction
    const arrowDirX = isStart ? -dirX : dirX;
    const arrowDirY = isStart ? -dirY : dirY;
    
    const arrowLength = 12;
    const arrowWidth = 8;
    
    // Calculate perpendicular vector for arrow wings
    const perpX = -arrowDirY;
    const perpY = arrowDirX;
    
    // Arrow tip is at the connection point
    const tipX = position.x;
    const tipY = position.y;
    
    // Arrow base points
    const baseX = tipX - arrowLength * arrowDirX;
    const baseY = tipY - arrowLength * arrowDirY;
    
    // Arrow wing points
    const wing1X = baseX + (arrowWidth / 2) * perpX;
    const wing1Y = baseY + (arrowWidth / 2) * perpY;
    const wing2X = baseX - (arrowWidth / 2) * perpX;
    const wing2Y = baseY - (arrowWidth / 2) * perpY;
    
    return (
      <polygon
        points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
        fill={style.color}
        opacity={style.opacity}
      />
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <g>
      {/* Main line/curve */}
      {renderLine()}
      
      {/* Start arrow */}
      {style.arrowStart && renderArrow(startPosition, true)}
      
      {/* End arrow */}
      {style.arrowEnd && renderArrow(endPosition, false)}
      
      {/* Label */}
      {label && (
        <text
          x={(startPosition.x + endPosition.x) / 2}
          y={(startPosition.y + endPosition.y) / 2 - 10}
          textAnchor="middle"
          fontSize="12"
          fill={style.color}
          opacity={style.opacity}
        >
          {label}
        </text>
      )}
      
      {/* Selection indicator */}
      {selected && (
        <line
          x1={startPosition.x}
          y1={startPosition.y}
          x2={endPosition.x}
          y2={endPosition.y}
          stroke="#3b82f6"
          strokeWidth={style.width + 2}
          opacity={0.3}
        />
      )}
    </g>
  );
};