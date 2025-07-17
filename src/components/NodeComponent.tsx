import React from 'react';
import { DiagramNode, NodeType } from '@/types/node';

interface NodeComponentProps {
  node: DiagramNode;
  zoom: number;
  onMouseDown?: (event: React.MouseEvent, nodeId: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({ node, zoom, onMouseDown }) => {
  const { position, size, title, type, selected, color } = node;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: position.x,
    top: position.y,
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
    zIndex: 10,
  };

  const textStyle: React.CSSProperties = {
    transform: type === NodeType.DIAMOND ? 'rotate(-45deg)' : 'none',
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if (onMouseDown) {
      onMouseDown(event, node.id);
    }
  };

  return (
    <div style={style} onMouseDown={handleMouseDown}>
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
  );
};