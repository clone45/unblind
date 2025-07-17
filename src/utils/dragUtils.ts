import { DiagramNode } from '@/types/node';
import { DiagramConnector } from '@/types/connector';

// Get connector endpoints that are near the mouse
export const getHoveredEndpoints = (
  connectors: DiagramConnector[],
  mousePosition: { x: number; y: number },
  hoverRadius: number = 15
) => {
  const hoveredEndpoints: Array<{ 
    connectorId: string; 
    point: 'start' | 'end'; 
    position: { x: number; y: number } 
  }> = [];

  connectors.forEach(connector => {
    // Check start point
    if (connector.startPoint.absolutePosition) {
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - connector.startPoint.absolutePosition.x, 2) +
        Math.pow(mousePosition.y - connector.startPoint.absolutePosition.y, 2)
      );
      if (distance <= hoverRadius) {
        hoveredEndpoints.push({
          connectorId: connector.id,
          point: 'start',
          position: connector.startPoint.absolutePosition
        });
      }
    }

    // Check end point
    if (connector.endPoint.absolutePosition) {
      const distance = Math.sqrt(
        Math.pow(mousePosition.x - connector.endPoint.absolutePosition.x, 2) +
        Math.pow(mousePosition.y - connector.endPoint.absolutePosition.y, 2)
      );
      if (distance <= hoverRadius) {
        hoveredEndpoints.push({
          connectorId: connector.id,
          point: 'end',
          position: connector.endPoint.absolutePosition
        });
      }
    }
  });

  return hoveredEndpoints;
};

// Check if mouse position is over a node (including skirt area)
export const getNodeAtPosition = (
  nodes: DiagramNode[],
  position: { x: number; y: number },
  skirtPadding: number = 16
) => {
  for (const node of nodes) {
    const bounds = {
      x: node.position.x - skirtPadding,
      y: node.position.y - skirtPadding,
      width: node.size.width + (skirtPadding * 2),
      height: node.size.height + (skirtPadding * 2)
    };
    
    if (position.x >= bounds.x && 
        position.x <= bounds.x + bounds.width &&
        position.y >= bounds.y && 
        position.y <= bounds.y + bounds.height) {
      return node;
    }
  }
  return null;
};