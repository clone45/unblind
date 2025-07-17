import { useState } from 'react';
import { DiagramNode } from '@/types/node';
import { DiagramConnector, ConnectionSide } from '@/types/connector';
import { DiagramCanvas } from '@/types/canvas';
import { getNodeAtPosition } from '@/utils/dragUtils';

interface ConnectionCreationState {
  isCreating: boolean;
  startNodeId: string | null;
  startMousePos: { x: number; y: number };
  startCanvasPos: { x: number; y: number };
}

interface UseConnectionCreationProps {
  canvas: DiagramCanvas | null;
  nodes: DiagramNode[];
  mousePosition: { x: number; y: number };
  onUpdate: () => void;
  getCanvasPosition: (clientX: number, clientY: number) => { x: number; y: number };
}

export const useConnectionCreation = ({ canvas, nodes, mousePosition, onUpdate, getCanvasPosition }: UseConnectionCreationProps) => {
  const [connectionCreationState, setConnectionCreationState] = useState<ConnectionCreationState>({
    isCreating: false,
    startNodeId: null,
    startMousePos: { x: 0, y: 0 },
    startCanvasPos: { x: 0, y: 0 }
  });

  // Calculate connection point from canvas position
  const calculateConnectionPointFromPosition = (node: DiagramNode, canvasPos: { x: number; y: number }) => {
    const nodeCenter = {
      x: node.position.x + node.size.width / 2,
      y: node.position.y + node.size.height / 2
    };

    // Determine which side of the node the position is on
    const relativeX = canvasPos.x - nodeCenter.x;
    const relativeY = canvasPos.y - nodeCenter.y;
    
    const absX = Math.abs(relativeX);
    const absY = Math.abs(relativeY);
    
    let side: ConnectionSide;
    let offset: number;
    
    if (absX > absY) {
      // Horizontal sides
      if (relativeX > 0) {
        side = ConnectionSide.RIGHT;
        offset = Math.max(0, Math.min(1, (canvasPos.y - node.position.y) / node.size.height));
      } else {
        side = ConnectionSide.LEFT;
        offset = Math.max(0, Math.min(1, (canvasPos.y - node.position.y) / node.size.height));
      }
    } else {
      // Vertical sides
      if (relativeY > 0) {
        side = ConnectionSide.BOTTOM;
        offset = Math.max(0, Math.min(1, (canvasPos.x - node.position.x) / node.size.width));
      } else {
        side = ConnectionSide.TOP;
        offset = Math.max(0, Math.min(1, (canvasPos.x - node.position.x) / node.size.width));
      }
    }
    
    return { side, offset };
  };

  const handleSkirtMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!canvas) return;
    
    // Use the provided canvas position calculator
    const canvasPos = getCanvasPosition(event.clientX, event.clientY);
    
    console.log('Starting connection creation from node:', nodeId, 'at position:', canvasPos);
    
    setConnectionCreationState({
      isCreating: true,
      startNodeId: nodeId,
      startMousePos: { x: event.clientX, y: event.clientY },
      startCanvasPos: canvasPos
    });
  };

  const handleConnectionDrop = () => {
    if (!canvas || !connectionCreationState.startNodeId) return;

    // Check if dropping on a valid target node
    const targetNode = getNodeAtPosition(nodes, mousePosition);
    
    if (targetNode && targetNode.id !== connectionCreationState.startNodeId) {
      // Get the start node to calculate the exact connection point
      const startNode = canvas.getNode(connectionCreationState.startNodeId);
      if (!startNode) return;
      
      // Calculate the exact connection point from the click position
      const startConnectionPoint = calculateConnectionPointFromPosition(startNode, connectionCreationState.startCanvasPos);
      
      // Calculate the end connection point from the drop position
      const endConnectionPoint = calculateConnectionPointFromPosition(targetNode, mousePosition);
      
      // Create the connection with custom connection points
      const newConnector = canvas.createConnector(
        connectionCreationState.startNodeId, 
        targetNode.id,
        startConnectionPoint.side,
        endConnectionPoint.side
      );
      
      if (newConnector) {
        // Update the connection points to use the exact positions
        newConnector.updateStartPoint(startNode.id, startConnectionPoint.side, startConnectionPoint.offset);
        newConnector.updateEndPoint(targetNode.id, endConnectionPoint.side, endConnectionPoint.offset);
        
        // Force position recalculation
        canvas.moveNode(startNode.id, startNode.position);
        canvas.moveNode(targetNode.id, targetNode.position);
        
        console.log('Connection created successfully:', newConnector.id);
        onUpdate();
      }
    } else {
      console.log('Invalid connection target - no connection created');
    }
    
    // Reset creation state
    setConnectionCreationState({
      isCreating: false,
      startNodeId: null,
      startMousePos: { x: 0, y: 0 },
      startCanvasPos: { x: 0, y: 0 }
    });
  };

  const cancelConnectionCreation = () => {
    setConnectionCreationState({
      isCreating: false,
      startNodeId: null,
      startMousePos: { x: 0, y: 0 },
      startCanvasPos: { x: 0, y: 0 }
    });
  };

  // Get connection creation preview line
  const getConnectionPreviewLine = () => {
    if (!connectionCreationState.isCreating || !connectionCreationState.startNodeId || !canvas) return null;

    const startNode = canvas.getNode(connectionCreationState.startNodeId);
    if (!startNode) return null;

    // Use the exact click position as the start position
    const startPosition = connectionCreationState.startCanvasPos;

    return {
      startPosition,
      currentPosition: mousePosition,
      startNodeId: connectionCreationState.startNodeId
    };
  };

  return {
    connectionCreationState,
    handleSkirtMouseDown,
    handleConnectionDrop,
    cancelConnectionCreation,
    getConnectionPreviewLine
  };
};