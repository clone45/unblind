import React, { useState } from 'react';
import { DiagramNode, NodeType } from '@/types/node';

interface NodeComponentProps {
  node: DiagramNode;
  zoom: number;
  onNodeMouseDown?: (event: React.MouseEvent, nodeId: string) => void;
  onSkirtClick?: (event: React.MouseEvent, nodeId: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, zoom, onNodeMouseDown, onSkirtClick }) => {
  const { position, size, title, type, selected, color } = node;
  const [isHovered, setIsHovered] = useState(false);

  const skirtPadding = 16; // Padding around the node for the skirt

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
    backgroundColor: isHovered ? 'rgba(107, 114, 128, 0.3)' : 'rgba(107, 114, 128, 0)', // Gray visible on hover
    cursor: 'crosshair',
    transform: type === NodeType.DIAMOND ? 'rotate(45deg)' : 'none',
    transformOrigin: 'center',
    transition: isHovered ? 'none' : 'background-color 0.9s ease-out', // Fade out on leave, instant on enter
  };

  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    top: skirtPadding,
    left: skirtPadding,
    width: size.width,
    height: size.height,
    backgroundColor: color,
    border: selected ? '2px solid #3b82f6' : '1px solid #d1d5db',
    borderRadius: type === NodeType.CIRCLE ? '50%' : type === NodeType.DIAMOND ? '0' : '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    fontSize: `${Math.max(12, 14 * zoom)}px`,
    color: '#ffffff',
    fontWeight: '500',
    transform: type === NodeType.DIAMOND ? 'rotate(45deg)' : 'none',
    transformOrigin: 'center',
    transition: 'all 0.1s ease',
    boxShadow: selected ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
  };

  const textStyle: React.CSSProperties = {
    transform: type === NodeType.DIAMOND ? 'rotate(-45deg)' : 'none',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };

  const handleSkirtClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (onSkirtClick) {
      onSkirtClick(event, node.id);
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
        onClick={handleSkirtClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Node Body - for dragging */}
      <div style={nodeStyle} onMouseDown={handleNodeMouseDown}>
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