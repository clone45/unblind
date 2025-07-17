import { DiagramNode, Node, Position, Size } from './node';
import { DiagramConnector, Connector, ConnectionPoint, ConnectionSide, ConnectionUtils } from './connector';

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  width: number;
  height: number;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
  snapToGrid: boolean;
}

export interface CanvasSettings {
  backgroundColor: string;
  grid: GridSettings;
  defaultNodeSize: Size;
  selectionColor: string;
  selectionWidth: number;
}

export interface SelectionState {
  selectedNodes: Set<string>;
  selectedConnectors: Set<string>;
  multiSelect: boolean;
}

export class DiagramCanvas {
  private nodes: Map<string, DiagramNode> = new Map();
  private connectors: Map<string, DiagramConnector> = new Map();
  private viewport: ViewportState;
  private selection: SelectionState;
  private settings: CanvasSettings;
  private history: Array<{ nodes: Map<string, DiagramNode>; connectors: Map<string, DiagramConnector> }> = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(width: number, height: number) {
    this.viewport = {
      zoom: 1.0,
      panX: 0,
      panY: 0,
      width,
      height
    };

    this.selection = {
      selectedNodes: new Set(),
      selectedConnectors: new Set(),
      multiSelect: false
    };

    this.settings = {
      backgroundColor: '#ffffff',
      grid: {
        enabled: true,
        size: 20,
        color: '#e5e7eb',
        opacity: 0.5,
        snapToGrid: true
      },
      defaultNodeSize: { width: 120, height: 60 },
      selectionColor: '#3b82f6',
      selectionWidth: 2
    };
  }

  // Viewport Methods
  setViewportSize(width: number, height: number): void {
    this.viewport.width = width;
    this.viewport.height = height;
  }

  setZoom(zoom: number): void {
    this.viewport.zoom = Math.max(0.1, Math.min(3.0, zoom));
  }

  setPan(x: number, y: number): void {
    this.viewport.panX = x;
    this.viewport.panY = y;
  }

  zoomIn(): void {
    this.setZoom(this.viewport.zoom * 1.2);
  }

  zoomOut(): void {
    this.setZoom(this.viewport.zoom / 1.2);
  }

  resetView(): void {
    this.viewport.zoom = 1.0;
    this.viewport.panX = 0;
    this.viewport.panY = 0;
  }

  // Coordinate Transformation
  screenToCanvas(screenPos: Position): Position {
    return {
      x: (screenPos.x - this.viewport.panX) / this.viewport.zoom,
      y: (screenPos.y - this.viewport.panY) / this.viewport.zoom
    };
  }

  canvasToScreen(canvasPos: Position): Position {
    return {
      x: canvasPos.x * this.viewport.zoom + this.viewport.panX,
      y: canvasPos.y * this.viewport.zoom + this.viewport.panY
    };
  }

  snapToGrid(position: Position): Position {
    if (!this.settings.grid.snapToGrid) return position;
    
    const gridSize = this.settings.grid.size;
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }

  // Node Management
  addNode(node: DiagramNode): void {
    this.nodes.set(node.id, node);
    this.saveToHistory();
  }

  removeNode(nodeId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    // Remove all connectors attached to this node
    const connectorsToRemove = Array.from(this.connectors.values())
      .filter(connector => connector.isConnectedToNode(nodeId))
      .map(connector => connector.id);

    connectorsToRemove.forEach(id => this.connectors.delete(id));
    this.nodes.delete(nodeId);
    this.selection.selectedNodes.delete(nodeId);
    this.saveToHistory();
    return true;
  }

  getNode(nodeId: string): DiagramNode | undefined {
    return this.nodes.get(nodeId);
  }

  getAllNodes(): DiagramNode[] {
    return Array.from(this.nodes.values());
  }

  moveNode(nodeId: string, newPosition: Position): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;

    const snappedPosition = this.snapToGrid(newPosition);
    node.updatePosition(snappedPosition);
    this.updateConnectorPositions(nodeId);
    return true;
  }

  // Connector Management
  addConnector(connector: DiagramConnector): void {
    this.connectors.set(connector.id, connector);
    this.saveToHistory();
  }

  removeConnector(connectorId: string): boolean {
    const removed = this.connectors.delete(connectorId);
    if (removed) {
      this.selection.selectedConnectors.delete(connectorId);
      this.saveToHistory();
    }
    return removed;
  }

  getConnector(connectorId: string): DiagramConnector | undefined {
    return this.connectors.get(connectorId);
  }

  getAllConnectors(): DiagramConnector[] {
    return Array.from(this.connectors.values());
  }

  createConnector(startNodeId: string, endNodeId: string, startSide?: ConnectionSide, endSide?: ConnectionSide): DiagramConnector | null {
    const startNode = this.nodes.get(startNodeId);
    const endNode = this.nodes.get(endNodeId);
    
    if (!startNode || !endNode) return null;

    // Auto-determine connection sides if not provided
    const autoStartSide = startSide || ConnectionUtils.getClosestSide(
      endNode.getCenter(), startNode.position, startNode.size
    );
    const autoEndSide = endSide || ConnectionUtils.getClosestSide(
      startNode.getCenter(), endNode.position, endNode.size
    );

    const connector = new DiagramConnector(
      `connector_${Date.now()}`,
      startNodeId,
      endNodeId,
      autoStartSide,
      autoEndSide
    );

    this.addConnector(connector);
    return connector;
  }

  private updateConnectorPositions(nodeId: string): void {
    const connectors = Array.from(this.connectors.values())
      .filter(connector => connector.isConnectedToNode(nodeId));

    connectors.forEach(connector => {
      if (connector.startPoint.nodeId === nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
          connector.startPoint.absolutePosition = ConnectionUtils.calculateConnectionPoint(
            node.position, node.size, connector.startPoint.side, connector.startPoint.offset
          );
        }
      }
      if (connector.endPoint.nodeId === nodeId) {
        const node = this.nodes.get(nodeId);
        if (node) {
          connector.endPoint.absolutePosition = ConnectionUtils.calculateConnectionPoint(
            node.position, node.size, connector.endPoint.side, connector.endPoint.offset
          );
        }
      }
    });
  }

  // Selection Management
  selectNode(nodeId: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.clearSelection();
    }
    
    const node = this.nodes.get(nodeId);
    if (node) {
      this.selection.selectedNodes.add(nodeId);
      node.select();
    }
  }

  selectConnector(connectorId: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.clearSelection();
    }
    
    const connector = this.connectors.get(connectorId);
    if (connector) {
      this.selection.selectedConnectors.add(connectorId);
      connector.select();
    }
  }

  deselectNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.selection.selectedNodes.delete(nodeId);
      node.deselect();
    }
  }

  deselectConnector(connectorId: string): void {
    const connector = this.connectors.get(connectorId);
    if (connector) {
      this.selection.selectedConnectors.delete(connectorId);
      connector.deselect();
    }
  }

  clearSelection(): void {
    this.selection.selectedNodes.forEach(nodeId => {
      const node = this.nodes.get(nodeId);
      if (node) node.deselect();
    });
    
    this.selection.selectedConnectors.forEach(connectorId => {
      const connector = this.connectors.get(connectorId);
      if (connector) connector.deselect();
    });

    this.selection.selectedNodes.clear();
    this.selection.selectedConnectors.clear();
  }

  getSelectedNodes(): DiagramNode[] {
    return Array.from(this.selection.selectedNodes)
      .map(id => this.nodes.get(id))
      .filter(node => node !== undefined) as DiagramNode[];
  }

  getSelectedConnectors(): DiagramConnector[] {
    return Array.from(this.selection.selectedConnectors)
      .map(id => this.connectors.get(id))
      .filter(connector => connector !== undefined) as DiagramConnector[];
  }

  // Hit Testing
  getNodeAtPosition(position: Position): DiagramNode | null {
    const canvasPos = this.screenToCanvas(position);
    
    // Check nodes in reverse order (top to bottom)
    const nodes = Array.from(this.nodes.values()).reverse();
    for (const node of nodes) {
      if (node.containsPoint(canvasPos)) {
        return node;
      }
    }
    return null;
  }

  getConnectorAtPosition(position: Position, tolerance: number = 5): DiagramConnector | null {
    const canvasPos = this.screenToCanvas(position);
    
    // Basic implementation - would need more sophisticated line intersection
    // For now, just check if click is near connector endpoints
    for (const connector of this.connectors.values()) {
      if (connector.startPoint.absolutePosition && connector.endPoint.absolutePosition) {
        const startDist = this.distance(canvasPos, connector.startPoint.absolutePosition);
        const endDist = this.distance(canvasPos, connector.endPoint.absolutePosition);
        
        if (startDist < tolerance || endDist < tolerance) {
          return connector;
        }
      }
    }
    return null;
  }

  private distance(a: Position, b: Position): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  // History Management
  private saveToHistory(): void {
    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Clone current state
    const nodesClone = new Map(Array.from(this.nodes.entries()).map(([id, node]) => [id, node.clone()]));
    const connectorsClone = new Map(Array.from(this.connectors.entries()).map(([id, connector]) => [id, connector.clone()]));
    
    this.history.push({ nodes: nodesClone, connectors: connectorsClone });
    this.historyIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  undo(): boolean {
    if (!this.canUndo()) return false;
    
    this.historyIndex--;
    const state = this.history[this.historyIndex];
    this.nodes = new Map(Array.from(state.nodes.entries()).map(([id, node]) => [id, node.clone()]));
    this.connectors = new Map(Array.from(state.connectors.entries()).map(([id, connector]) => [id, connector.clone()]));
    this.clearSelection();
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;
    
    this.historyIndex++;
    const state = this.history[this.historyIndex];
    this.nodes = new Map(Array.from(state.nodes.entries()).map(([id, node]) => [id, node.clone()]));
    this.connectors = new Map(Array.from(state.connectors.entries()).map(([id, connector]) => [id, connector.clone()]));
    this.clearSelection();
    return true;
  }

  // Settings
  updateSettings(newSettings: Partial<CanvasSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): CanvasSettings {
    return { ...this.settings };
  }

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  // Serialization
  toJSON(): any {
    return {
      nodes: Array.from(this.nodes.entries()),
      connectors: Array.from(this.connectors.entries()),
      viewport: this.viewport,
      settings: this.settings
    };
  }

  fromJSON(data: any): void {
    this.nodes.clear();
    this.connectors.clear();
    
    if (data.nodes) {
      data.nodes.forEach(([id, nodeData]: [string, any]) => {
        const node = new DiagramNode(nodeData.id, nodeData.title, nodeData.position, nodeData.type, nodeData.size);
        Object.assign(node, nodeData);
        this.nodes.set(id, node);
      });
    }
    
    if (data.connectors) {
      data.connectors.forEach(([id, connectorData]: [string, any]) => {
        const connector = new DiagramConnector(
          connectorData.id,
          connectorData.startPoint.nodeId,
          connectorData.endPoint.nodeId,
          connectorData.startPoint.side,
          connectorData.endPoint.side,
          connectorData.startPoint.offset,
          connectorData.endPoint.offset
        );
        Object.assign(connector, connectorData);
        this.connectors.set(id, connector);
      });
    }
    
    if (data.viewport) {
      this.viewport = { ...data.viewport };
    }
    
    if (data.settings) {
      this.settings = { ...this.settings, ...data.settings };
    }
    
    this.clearSelection();
    this.saveToHistory();
  }
}