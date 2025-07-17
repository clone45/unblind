import { useState } from 'react';
import { DiagramNode } from '@/types/node';
import { DiagramConnector, ConnectionSide } from '@/types/connector';
import { DiagramCanvas } from '@/types/canvas';
import { getNodeAtPosition } from '@/utils/dragUtils';

interface EndpointDragState {
  isDragging: boolean;
  connectorId: string | null;
  endpointType: 'start' | 'end' | null;
  startMousePos: { x: number; y: number };
  originalConnectionPoint: { side: ConnectionSide; offset: number } | null;
}

interface UseEndpointDragProps {
  canvas: DiagramCanvas | null;
  nodes: DiagramNode[];
  mousePosition: { x: number; y: number };
  onUpdate: () => void;
}

export const useEndpointDrag = ({ canvas, nodes, mousePosition, onUpdate }: UseEndpointDragProps) => {
  const [endpointDragState, setEndpointDragState] = useState<EndpointDragState>({
    isDragging: false,
    connectorId: null,
    endpointType: null,
    startMousePos: { x: 0, y: 0 },
    originalConnectionPoint: null
  });

  const handleEndpointMouseDown = (event: React.MouseEvent, connectorId: string, endpointType: 'start' | 'end') => {
    event.preventDefault();
    event.stopPropagation();
    
    const connector = canvas?.getConnector(connectorId);
    if (!connector) return;

    const connectionPoint = endpointType === 'start' ? connector.startPoint : connector.endPoint;
    
    console.log('Starting endpoint drag:', connectorId, endpointType);
    
    setEndpointDragState({
      isDragging: true,
      connectorId,
      endpointType,
      startMousePos: { x: event.clientX, y: event.clientY },
      originalConnectionPoint: {
        side: connectionPoint.side,
        offset: connectionPoint.offset
      }
    });
  };

  const handleEndpointDrop = () => {
    if (!canvas || !endpointDragState.connectorId || !endpointDragState.endpointType) return;

    const connector = canvas.getConnector(endpointDragState.connectorId);
    if (!connector) return;

    // Check if dropping on a valid node skirt
    const targetNode = getNodeAtPosition(nodes, mousePosition);
    
    if (targetNode) {
      // Calculate the new connection point
      const newConnectionPoint = calculateConnectionPoint(targetNode, mousePosition);
      
      if (newConnectionPoint) {
        // Update the connector
        if (endpointDragState.endpointType === 'start') {
          connector.updateStartPoint(targetNode.id, newConnectionPoint.side, newConnectionPoint.offset);
        } else {
          connector.updateEndPoint(targetNode.id, newConnectionPoint.side, newConnectionPoint.offset);
        }
        
        // Update the absolute position
        canvas.moveNode(targetNode.id, targetNode.position); // Force recalculation
        
        console.log('Endpoint dropped successfully on node:', targetNode.id, newConnectionPoint);
      } else {
        console.log('Invalid drop position - deleting connector');
        canvas.removeConnector(endpointDragState.connectorId);
      }
    } else {
      console.log('Dropped outside valid target - deleting connector');
      canvas.removeConnector(endpointDragState.connectorId);
    }
    
    // Reset drag state
    setEndpointDragState({
      isDragging: false,
      connectorId: null,
      endpointType: null,
      startMousePos: { x: 0, y: 0 },
      originalConnectionPoint: null
    });
    
    onUpdate();
  };



  // Calculate connection point from drop position
  const calculateConnectionPoint = (node: DiagramNode, dropPosition: { x: number; y: number }) => {
    const nodeCenter = {
      x: node.position.x + node.size.width / 2,
      y: node.position.y + node.size.height / 2
    };

    // Determine which side of the node the drop occurred on
    const relativeX = dropPosition.x - nodeCenter.x;
    const relativeY = dropPosition.y - nodeCenter.y;
    
    const absX = Math.abs(relativeX);
    const absY = Math.abs(relativeY);
    
    let side: ConnectionSide;
    let offset: number;
    
    if (absX > absY) {
      // Horizontal sides
      if (relativeX > 0) {
        side = ConnectionSide.RIGHT;
        offset = Math.max(0, Math.min(1, (dropPosition.y - node.position.y) / node.size.height));
      } else {
        side = ConnectionSide.LEFT;
        offset = Math.max(0, Math.min(1, (dropPosition.y - node.position.y) / node.size.height));
      }
    } else {
      // Vertical sides
      if (relativeY > 0) {
        side = ConnectionSide.BOTTOM;
        offset = Math.max(0, Math.min(1, (dropPosition.x - node.position.x) / node.size.width));
      } else {
        side = ConnectionSide.TOP;
        offset = Math.max(0, Math.min(1, (dropPosition.x - node.position.x) / node.size.width));
      }
    }
    
    return { side, offset };
  };

  // Get drag preview line data
  const getDragPreviewLine = () => {
    if (!endpointDragState.isDragging || !canvas || !endpointDragState.connectorId) return null;

    const connector = canvas.getConnector(endpointDragState.connectorId);
    if (!connector) return null;

    // Get the fixed endpoint position (the one we're NOT dragging)
    const fixedEndpoint = endpointDragState.endpointType === 'start' ? 'end' : 'start';
    const fixedPoint = fixedEndpoint === 'start' ? connector.startPoint : connector.endPoint;
    
    if (!fixedPoint.absolutePosition) return null;

    return {
      fixedPosition: fixedPoint.absolutePosition,
      currentPosition: mousePosition,
      connectorId: endpointDragState.connectorId,
      draggingEndpoint: endpointDragState.endpointType
    };
  };

  return {
    endpointDragState,
    handleEndpointMouseDown,
    handleEndpointDrop,
    getDragPreviewLine
  };
};