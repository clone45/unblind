import React, { useState } from 'react';
import { DiagramNode, NodeType } from '@/types/node';
import { LogHighlightStyle } from '@/types/log';

interface NodeComponentProps {
  node: DiagramNode;
  zoom: number;
  onNodeMouseDown?: (event: React.MouseEvent, nodeId: string) => void;
  onSkirtMouseDown?: (event: React.MouseEvent, nodeId: string) => void;
  suppressSkirtHover?: boolean;
  forceSkirtHover?: boolean;
  logHighlight?: LogHighlightStyle;
  disableHover?: boolean;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, zoom, onNodeMouseDown, onSkirtMouseDown, suppressSkirtHover = false, forceSkirtHover = false, logHighlight, disableHover = false }) => {
  const { position, size, title, type, selected, color } = node;
  const [isHovered, setIsHovered] = useState(false);

  // Force unhover when endpoint detection is active
  React.useEffect(() => {
    if (suppressSkirtHover && isHovered) {
      setIsHovered(false);
    }
  }, [suppressSkirtHover, isHovered]);

  const skirtPadding = 16; // Padding around the node for the skirt

  // Helper function to get log highlight styles
  const getLogHighlightStyles = (): Partial<React.CSSProperties> => {
    if (!logHighlight) return {};
    
    const styles: Partial<React.CSSProperties> = {};
    
    // Check if this is an error state and apply red background
    if (logHighlight.style === 'error') {
      styles.backgroundColor = '#dc2626'; // Red background for error state
    }
    
    switch (logHighlight.type) {
      case 'highlight':
        styles.boxShadow = `0 0 0 3px ${logHighlight.color}40, 0 2px 4px rgba(0, 0, 0, 0.1)`;
        break;
      case 'focus':
        styles.boxShadow = `0 0 0 4px ${logHighlight.color}60, 0 0 20px ${logHighlight.color}30, 0 2px 4px rgba(0, 0, 0, 0.1)`;
        styles.transform = `${type === NodeType.DIAMOND ? 'rotate(45deg)' : ''} scale(1.05)`;
        break;
      case 'annotate':
        styles.boxShadow = `0 0 0 2px ${logHighlight.color}, 0 2px 4px rgba(0, 0, 0, 0.1)`;
        break;
      case 'trace':
        styles.boxShadow = `0 0 0 2px ${logHighlight.color}, 0 2px 4px rgba(0, 0, 0, 0.1)`;
        break;
      case 'pulse':
        styles.boxShadow = `0 0 0 3px ${logHighlight.color}60, 0 2px 4px rgba(0, 0, 0, 0.1)`;
        break;
    }
    
    return styles;
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

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x - skirtPadding,
    top: position.y - skirtPadding,
    width: size.width + (skirtPadding * 2),
    height: size.height + (skirtPadding * 2),
    zIndex: 10,
  };

  const skirtStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderRadius: type === NodeType.CIRCLE ? '50%' : type === NodeType.DIAMOND ? '0' : '12px',
    backgroundColor: (forceSkirtHover || (isHovered && !suppressSkirtHover && !disableHover)) ? 'rgba(107, 114, 128, 0.3)' : 'rgba(107, 114, 128, 0)', // Gray visible on hover unless suppressed or disabled
    cursor: disableHover ? 'default' : (suppressSkirtHover ? 'pointer' : 'crosshair'), // Default cursor when hover disabled
    transform: type === NodeType.DIAMOND ? 'rotate(45deg)' : 'none',
    transformOrigin: 'center',
    transition: (forceSkirtHover || (isHovered && !suppressSkirtHover && !disableHover)) ? 'none' : 'background-color 0.9s ease-out', // Fade out on leave, instant on enter
  };

  const logHighlightStyles = getLogHighlightStyles();
  const animationClass = getAnimationClass();
  
  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    top: skirtPadding,
    left: skirtPadding,
    width: size.width,
    height: size.height,
    backgroundColor: color,
    border: selected ? '3px solid #000000' : '1px solid #d1d5db',
    borderRadius: type === NodeType.CIRCLE ? '50%' : type === NodeType.DIAMOND ? '0' : '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disableHover ? 'default' : 'pointer',
    userSelect: 'none',
    fontSize: `${Math.max(12, 14 * zoom)}px`,
    color: '#ffffff',
    fontWeight: '500',
    transform: type === NodeType.DIAMOND ? 'rotate(45deg)' : 'none',
    transformOrigin: 'center',
    transition: 'all 0.1s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    ...logHighlightStyles, // Merge log highlight styles
  };

  const textStyle: React.CSSProperties = {
    transform: type === NodeType.DIAMOND ? 'rotate(-45deg)' : 'none',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };

  const handleSkirtMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSkirtMouseDown) {
      onSkirtMouseDown(event, node.id);
    }
  };

  const handleNodeMouseDown = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onNodeMouseDown) {
      onNodeMouseDown(event, node.id);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Skirt - for connection creation */}
      <div 
        style={skirtStyle}
        onMouseDown={handleSkirtMouseDown}
        onMouseEnter={() => {
          if (!suppressSkirtHover && !disableHover) {
            console.log('Skirt hover ENTER on node:', node.id);
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!suppressSkirtHover && !disableHover) {
            console.log('Skirt hover LEAVE on node:', node.id);
            setIsHovered(false);
          }
        }}
      />
      
      {/* Node Body - for dragging */}
      <div 
        style={nodeStyle} 
        className={animationClass} 
        onMouseDown={handleNodeMouseDown}
        onMouseEnter={() => {
          if (!suppressSkirtHover && !disableHover) {
            console.log('Node body hover ENTER on node:', node.id);
            setIsHovered(true);
          }
        }}
        onMouseLeave={() => {
          if (!suppressSkirtHover && !disableHover) {
            console.log('Node body hover LEAVE on node:', node.id);
            setIsHovered(false);
          }
        }}
      >
        {type === NodeType.TEXT ? (
          <div style={{ ...textStyle, color: '#000000', fontSize: `${Math.max(12, 16 * zoom)}px` }}>
            {title}
          </div>
        ) : (
          <div style={textStyle}>
            {title}
          </div>
        )}
      </div>
    </div>
  );
};