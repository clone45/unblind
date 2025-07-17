import React from 'react';

interface EndpointOverlayProps {
  hoveredEndpoints: Array<{
    connectorId: string;
    point: 'start' | 'end';
    position: { x: number; y: number };
  }>;
  dragPreviewLine: {
    fixedPosition: { x: number; y: number };
    currentPosition: { x: number; y: number };
    connectorId: string;
    draggingEndpoint: 'start' | 'end' | null;
  } | null;
  connectionPreviewLine: {
    startPosition: { x: number; y: number };
    currentPosition: { x: number; y: number };
    startNodeId: string;
  } | null;
  onEndpointMouseDown: (event: React.MouseEvent, connectorId: string, endpointType: 'start' | 'end') => void;
}

export const EndpointOverlay: React.FC<EndpointOverlayProps> = ({
  hoveredEndpoints,
  dragPreviewLine,
  connectionPreviewLine,
  onEndpointMouseDown
}) => {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15 // Above nodes (10) and connectors (5)
      }}
    >
      {/* Drag Preview Line */}
      {dragPreviewLine && (
        <g>
          <line
            x1={dragPreviewLine.fixedPosition.x}
            y1={dragPreviewLine.fixedPosition.y}
            x2={dragPreviewLine.currentPosition.x}
            y2={dragPreviewLine.currentPosition.y}
            stroke="rgba(59, 130, 246, 0.7)"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          {/* Show a circle at the dragged endpoint position */}
          <circle
            cx={dragPreviewLine.currentPosition.x}
            cy={dragPreviewLine.currentPosition.y}
            r={6}
            fill="rgba(59, 130, 246, 0.8)"
            stroke="rgba(59, 130, 246, 1)"
            strokeWidth="2"
          />
        </g>
      )}

      {/* Connection Creation Preview Line */}
      {connectionPreviewLine && (
        <g>
          <line
            x1={connectionPreviewLine.startPosition.x}
            y1={connectionPreviewLine.startPosition.y}
            x2={connectionPreviewLine.currentPosition.x}
            y2={connectionPreviewLine.currentPosition.y}
            stroke="rgba(34, 197, 94, 0.7)"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          {/* Show a circle at the connection start position */}
          <circle
            cx={connectionPreviewLine.startPosition.x}
            cy={connectionPreviewLine.startPosition.y}
            r={4}
            fill="rgba(34, 197, 94, 0.8)"
            stroke="rgba(34, 197, 94, 1)"
            strokeWidth="2"
          />
          {/* Show a circle at the current mouse position */}
          <circle
            cx={connectionPreviewLine.currentPosition.x}
            cy={connectionPreviewLine.currentPosition.y}
            r={4}
            fill="rgba(34, 197, 94, 0.8)"
            stroke="rgba(34, 197, 94, 1)"
            strokeWidth="2"
          />
        </g>
      )}
      
      {/* Endpoint Hover Circles */}
      {hoveredEndpoints.map((endpoint, index) => (
        <circle
          key={`${endpoint.connectorId}-${endpoint.point}-${index}`}
          cx={endpoint.position.x}
          cy={endpoint.position.y}
          r={12}
          fill="rgba(0, 0, 0, 0.3)"
          stroke="rgba(0, 0, 0, 0.6)"
          strokeWidth="2"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onMouseDown={(e) => onEndpointMouseDown(e as any, endpoint.connectorId, endpoint.point)}
        />
      ))}
    </svg>
  );
};