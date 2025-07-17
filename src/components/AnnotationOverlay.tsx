import React from 'react';
import { DiagramNode } from '@/types/node';
import { DiagramConnector } from '@/types/connector';
import { ConnectionUtils } from '@/types/connector';

interface AnnotationOverlayProps {
  nodes: DiagramNode[];
  connectors: DiagramConnector[];
  annotations: Map<string, string>;
}

export const AnnotationOverlay: React.FC<AnnotationOverlayProps> = ({
  nodes,
  connectors,
  annotations
}) => {
  if (annotations.size === 0) return null;

  const getNodeAnnotationPosition = (node: DiagramNode) => {
    // Position annotation to the right of the node with some padding
    return {
      x: node.position.x + node.size.width + 10,
      y: node.position.y + node.size.height / 2
    };
  };

  const getConnectorAnnotationPosition = (connector: DiagramConnector) => {
    const startNode = nodes.find(n => n.id === connector.startPoint.nodeId);
    const endNode = nodes.find(n => n.id === connector.endPoint.nodeId);
    
    if (!startNode || !endNode) return null;

    // Calculate the midpoint of the connector
    const startPos = connector.startPoint.absolutePosition || ConnectionUtils.calculateConnectionPoint(
      startNode.position,
      startNode.size,
      connector.startPoint.side,
      connector.startPoint.offset
    );
    
    const endPos = connector.endPoint.absolutePosition || ConnectionUtils.calculateConnectionPoint(
      endNode.position,
      endNode.size,
      connector.endPoint.side,
      connector.endPoint.offset
    );

    return {
      x: (startPos.x + endPos.x) / 2,
      y: (startPos.y + endPos.y) / 2 - 20 // Position above the connector
    };
  };

  return (
    <div className="annotation-overlay" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 15 // Above nodes and connectors
    }}>
      {Array.from(annotations.entries()).map(([elementId, annotationText]) => {
        // Check if it's a node
        const node = nodes.find(n => n.id === elementId);
        if (node) {
          const position = getNodeAnnotationPosition(node);
          return (
            <div
              key={`annotation-${elementId}`}
              className="annotation-bubble node-annotation"
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translateY(-50%)',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                maxWidth: '200px',
                wordWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {annotationText}
              {/* Arrow pointing to the node */}
              <div style={{
                position: 'absolute',
                left: '-6px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: '6px solid #1f2937'
              }} />
            </div>
          );
        }

        // Check if it's a connector
        const connector = connectors.find(c => c.id === elementId);
        if (connector) {
          const position = getConnectorAnnotationPosition(connector);
          if (!position) return null;

          return (
            <div
              key={`annotation-${elementId}`}
              className="annotation-bubble connector-annotation"
              style={{
                position: 'absolute',
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)',
                backgroundColor: '#1f2937',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                maxWidth: '200px',
                wordWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {annotationText}
              {/* Arrow pointing down to the connector */}
              <div style={{
                position: 'absolute',
                left: '50%',
                bottom: '-6px',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: '6px solid #1f2937'
              }} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};