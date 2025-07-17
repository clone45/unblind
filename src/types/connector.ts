import { Position } from './node';

export enum ConnectionSide {
  TOP = 'top',
  RIGHT = 'right',
  BOTTOM = 'bottom',
  LEFT = 'left'
}

export interface ConnectionPoint {
  nodeId: string;
  side: ConnectionSide;
  offset: number; // 0.0 to 1.0, representing position along the edge (0 = start, 1 = end)
  absolutePosition?: Position; // Calculated position in canvas coordinates
}

export interface Connector {
  id: string;
  startPoint: ConnectionPoint;
  endPoint: ConnectionPoint;
  type: ConnectorType;
  style: ConnectorStyle;
  selected: boolean;
  label?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum ConnectorType {
  STRAIGHT = 'straight',
  CURVED = 'curved',
  ORTHOGONAL = 'orthogonal', // Right-angle connections
  BEZIER = 'bezier'
}

export interface ConnectorStyle {
  color: string;
  width: number;
  dashPattern?: number[]; // For dashed lines [dash, gap, dash, gap...]
  arrowStart: boolean;
  arrowEnd: boolean;
  opacity: number;
}

export class DiagramConnector implements Connector {
  id: string;
  startPoint: ConnectionPoint;
  endPoint: ConnectionPoint;
  type: ConnectorType;
  style: ConnectorStyle;
  selected: boolean;
  label?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    startNodeId: string,
    endNodeId: string,
    startSide: ConnectionSide = ConnectionSide.RIGHT,
    endSide: ConnectionSide = ConnectionSide.LEFT,
    startOffset: number = 0.5,
    endOffset: number = 0.5
  ) {
    this.id = id;
    this.startPoint = {
      nodeId: startNodeId,
      side: startSide,
      offset: startOffset
    };
    this.endPoint = {
      nodeId: endNodeId,
      side: endSide,
      offset: endOffset
    };
    this.type = ConnectorType.STRAIGHT;
    this.style = {
      color: '#6b7280', // Default gray
      width: 2,
      arrowStart: false,
      arrowEnd: true,
      opacity: 1.0
    };
    this.selected = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  updateStartPoint(nodeId: string, side: ConnectionSide, offset: number): void {
    this.startPoint = { nodeId, side, offset };
    this.updatedAt = new Date();
  }

  updateEndPoint(nodeId: string, side: ConnectionSide, offset: number): void {
    this.endPoint = { nodeId, side, offset };
    this.updatedAt = new Date();
  }

  updateType(newType: ConnectorType): void {
    this.type = newType;
    this.updatedAt = new Date();
  }

  updateStyle(styleUpdate: Partial<ConnectorStyle>): void {
    this.style = { ...this.style, ...styleUpdate };
    this.updatedAt = new Date();
  }

  setLabel(label: string): void {
    this.label = label;
    this.updatedAt = new Date();
  }

  select(): void {
    this.selected = true;
    this.updatedAt = new Date();
  }

  deselect(): void {
    this.selected = false;
    this.updatedAt = new Date();
  }

  isConnectedToNode(nodeId: string): boolean {
    return this.startPoint.nodeId === nodeId || this.endPoint.nodeId === nodeId;
  }

  getOtherNodeId(nodeId: string): string | null {
    if (this.startPoint.nodeId === nodeId) {
      return this.endPoint.nodeId;
    } else if (this.endPoint.nodeId === nodeId) {
      return this.startPoint.nodeId;
    }
    return null;
  }

  reverse(): void {
    const temp = this.startPoint;
    this.startPoint = this.endPoint;
    this.endPoint = temp;
    this.updatedAt = new Date();
  }

  clone(): DiagramConnector {
    const cloned = new DiagramConnector(
      this.id + '_copy',
      this.startPoint.nodeId,
      this.endPoint.nodeId,
      this.startPoint.side,
      this.endPoint.side,
      this.startPoint.offset,
      this.endPoint.offset
    );
    cloned.type = this.type;
    cloned.style = { ...this.style };
    cloned.selected = this.selected;
    cloned.label = this.label;
    cloned.metadata = this.metadata ? { ...this.metadata } : undefined;
    return cloned;
  }
}

// Helper functions for calculating connection points
export class ConnectionUtils {
  static calculateConnectionPoint(
    nodePosition: Position,
    nodeSize: { width: number; height: number },
    side: ConnectionSide,
    offset: number
  ): Position {
    const { x, y } = nodePosition;
    const { width, height } = nodeSize;

    switch (side) {
      case ConnectionSide.TOP:
        return { x: x + width * offset, y };
      case ConnectionSide.RIGHT:
        return { x: x + width, y: y + height * offset };
      case ConnectionSide.BOTTOM:
        return { x: x + width * offset, y: y + height };
      case ConnectionSide.LEFT:
        return { x, y: y + height * offset };
      default:
        return { x: x + width / 2, y: y + height / 2 };
    }
  }

  static getClosestSide(
    fromPosition: Position,
    toNodePosition: Position,
    toNodeSize: { width: number; height: number }
  ): ConnectionSide {
    const nodeCenter = {
      x: toNodePosition.x + toNodeSize.width / 2,
      y: toNodePosition.y + toNodeSize.height / 2
    };

    const dx = fromPosition.x - nodeCenter.x;
    const dy = fromPosition.y - nodeCenter.y;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (absX > absY) {
      return dx > 0 ? ConnectionSide.LEFT : ConnectionSide.RIGHT;
    } else {
      return dy > 0 ? ConnectionSide.TOP : ConnectionSide.BOTTOM;
    }
  }
}