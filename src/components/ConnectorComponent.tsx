import React from 'react';
import { DiagramConnector, ConnectorType } from '@/types/connector';
import { Position } from '@/types/node';
import { LogHighlightStyle } from '@/types/log';

interface ConnectorComponentProps {
  connector: DiagramConnector;
  startPosition: Position;
  endPosition: Position;
  visible?: boolean;
  logHighlight?: LogHighlightStyle;
  onConnectorClick?: (event: React.MouseEvent, connectorId: string) => void;
}

export const ConnectorComponent: React.FC<ConnectorComponentProps> = ({ 
  connector, 
  startPosition, 
  endPosition,
  visible = true,
  logHighlight,
  onConnectorClick
}) => {
  const { style, type, selected, label } = connector;

  // Helper function to get log highlight stroke properties
  const getLogHighlightStroke = (): { stroke: string; strokeWidth: number; strokeDasharray?: string; opacity: number } => {
    if (!logHighlight) {
      return {
        stroke: style.color,
        strokeWidth: style.width,
        strokeDasharray: style.dashPattern?.join(' '),
        opacity: style.opacity
      };
    }
    
    let strokeWidth = style.width;
    let opacity = style.opacity;
    
    switch (logHighlight.type) {
      case 'highlight':
        strokeWidth = Math.max(style.width, 3);
        opacity = 1;
        break;
      case 'focus':
        strokeWidth = Math.max(style.width, 5);
        opacity = 1;
        break;
      case 'annotate':
        strokeWidth = Math.max(style.width, 2);
        opacity = 1;
        break;
      case 'trace':
        strokeWidth = Math.max(style.width, 4);
        opacity = 1;
        break;
      case 'pulse':
        strokeWidth = Math.max(style.width, 3);
        opacity = 0.8;
        break;
    }
    
    return {
      stroke: logHighlight.color || style.color,
      strokeWidth,
      strokeDasharray: style.dashPattern?.join(' '),
      opacity
    };
  };

  // Helper function to get animation classes
  const getAnimationClass = (): string => {
    if (!logHighlight?.animation) return '';
    
    switch (logHighlight.type) {
      case 'pulse':
        return 'animate-pulse';
      case 'trace':
        return 'animate-ping';
      default:
        return '';
    }
  };

  // Handle connector click
  const handleConnectorClick = (event: React.MouseEvent) => {
    console.log('Connector clicked:', connector.id);
    event.stopPropagation();
    onConnectorClick?.(event, connector.id);
  };

  const renderLine = () => {
    const strokeProps = getLogHighlightStroke();
    
    switch (type) {
      case ConnectorType.STRAIGHT:
        return (
          <line
            x1={startPosition.x}
            y1={startPosition.y}
            x2={endPosition.x}
            y2={endPosition.y}
            stroke={strokeProps.stroke}
            strokeWidth={strokeProps.strokeWidth}
            strokeDasharray={strokeProps.strokeDasharray}
            opacity={strokeProps.opacity}
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
            stroke={strokeProps.stroke}
            strokeWidth={strokeProps.strokeWidth}
            fill="none"
            strokeDasharray={strokeProps.strokeDasharray}
            opacity={strokeProps.opacity}
          />
        );
      
      default:
        return renderLine(); // Default to straight
    }
  };

  // Render invisible hit area for clicking (wider than visible line)
  const renderHitArea = () => {
    const hitAreaWidth = Math.max(12, style.width + 8); // Minimum 12px hit area
    
    switch (type) {
      case ConnectorType.STRAIGHT:
        return (
          <line
            x1={startPosition.x}
            y1={startPosition.y}
            x2={endPosition.x}
            y2={endPosition.y}
            stroke="transparent"
            strokeWidth={hitAreaWidth}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={handleConnectorClick}
            onMouseDown={handleConnectorClick}
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
            stroke="transparent"
            strokeWidth={hitAreaWidth}
            fill="none"
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={handleConnectorClick}
            onMouseDown={handleConnectorClick}
          />
        );
      
      default:
        return renderHitArea(); // Default to straight
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

  const animationClass = getAnimationClass();

  return (
    <g className={animationClass}>
      {/* Main line/curve */}
      {renderLine()}
      
      {/* Start arrow */}
      {style.arrowStart && renderArrow(startPosition, true)}
      
      {/* End arrow */}
      {style.arrowEnd && renderArrow(endPosition, false)}
      
      {/* Invisible hit area for clicking (rendered last to be on top) */}
      {onConnectorClick && renderHitArea()}
      
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