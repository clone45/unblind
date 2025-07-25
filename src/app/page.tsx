'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { useEndpointDrag } from "@/hooks/useEndpointDrag";
import { useConnectionCreation } from "@/hooks/useConnectionCreation";
import { NodeComponent } from "@/components/NodeComponent";
import { GridComponent } from "@/components/GridComponent";
import { ConnectorComponent } from "@/components/ConnectorComponent";
import { EndpointOverlay } from "@/components/EndpointOverlay";
import { NodeEditor } from "@/components/NodeEditor";
import { AnnotationOverlay } from "@/components/AnnotationOverlay";
import { LogViewer } from "@/components/LogViewer";
import { DiagramNode, NodeType } from "@/types/node";
import { ConnectionUtils, ConnectionSide, DiagramConnector } from "@/types/connector";
import { LogEntry } from "@/types/log";
import { getHoveredEndpoints } from "@/utils/dragUtils";
import { useEffect, useState, useRef, useCallback } from "react";

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startMousePos: { x: number; y: number };
  startNodePos: { x: number; y: number };
  wasAlreadySelected: boolean;
  hasDraggedNode: boolean;
}


export default function Home() {
  const { canvas, nodes, connectors, viewport, refresh } = useCanvas();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startMousePos: { x: 0, y: 0 },
    startNodePos: { x: 0, y: 0 },
    wasAlreadySelected: false,
    hasDraggedNode: false
  });
  const [hoveredEndpoint, setHoveredEndpoint] = useState<{ connectorId: string; endpointType: 'start' | 'end' } | null>(null);
  const [selectedLogEntry, setSelectedLogEntry] = useState<LogEntry | null>(null);
  const [currentMode, setCurrentMode] = useState<'graph' | 'log'>('log');
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Use the endpoint drag hook
  const { endpointDragState, handleEndpointMouseDown: originalHandleEndpointMouseDown, handleEndpointDrop, getDragPreviewLine } = useEndpointDrag({
    canvas,
    nodes,
    mousePosition,
    onUpdate: refresh
  });

  // Wrap endpoint mouse down to check mode
  const handleEndpointMouseDown = (event: React.MouseEvent, connectorId: string, endpointType: 'start' | 'end') => {
    // Don't allow endpoint dragging in Log Explorer mode
    if (currentMode === 'log') return;
    originalHandleEndpointMouseDown(event, connectorId, endpointType);
  };
  
  // Canvas position calculator function
  const getCanvasPosition = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: clientX, y: clientY };
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Use the connection creation hook
  const { connectionCreationState, handleSkirtMouseDown: originalHandleSkirtMouseDown, handleConnectionDrop, cancelConnectionCreation, getConnectionPreviewLine } = useConnectionCreation({
    canvas,
    nodes,
    mousePosition,
    onUpdate: refresh,
    getCanvasPosition
  });

  // Wrap skirt mouse down to check mode
  const handleSkirtMouseDown = (event: React.MouseEvent, nodeId: string) => {
    // Don't allow connection creation in Log Explorer mode
    if (currentMode === 'log') return;
    originalHandleSkirtMouseDown(event, nodeId);
  };

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({ 
        width: window.innerWidth - 320, // Subtract right panel width
        height: window.innerHeight 
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Add test nodes and connection when canvas is ready
  useEffect(() => {
    if (canvas && canvas.getAllNodes().length === 0) { // Only create if no nodes exist
      // Create two test nodes
      const testNode1 = new DiagramNode(
        "test-node-1",
        "Hello World",
        { x: 100, y: 100 },
        NodeType.RECTANGLE,
        { width: 120, height: 60 }
      );
      
      const testNode2 = new DiagramNode(
        "test-node-2",
        "Second Node",
        { x: 300, y: 200 },
        NodeType.RECTANGLE,
        { width: 120, height: 60 }
      );
      
      canvas.addNode(testNode1);
      canvas.addNode(testNode2);
      
      // Create a test connection between them
      console.log('Node1 position:', testNode1.position, 'center:', testNode1.getCenter());
      console.log('Node2 position:', testNode2.position, 'center:', testNode2.getCenter());
      
      // Create connectors with predictable IDs for testing
      const testConnector1 = new DiagramConnector(
        "test-connector-1",
        "test-node-1",
        "test-node-2",
        ConnectionSide.RIGHT,
        ConnectionSide.LEFT
      );
      const testConnector2 = new DiagramConnector(
        "test-connector-2", 
        "test-node-2",
        "test-node-1",
        ConnectionSide.TOP,
        ConnectionSide.BOTTOM
      );
      
      // Configure connectors
      testConnector1.style.arrowStart = false;
      testConnector1.style.arrowEnd = true;
      testConnector2.style.arrowStart = false;
      testConnector2.style.arrowEnd = true;
      
      // Add connectors to canvas
      canvas.addConnector(testConnector1);
      canvas.addConnector(testConnector2);
      
      console.log('Created test connectors:', testConnector1, testConnector2);
      
      // Make sure initial positions are calculated
      if (testConnector1 && testConnector2) {
        canvas.moveNode("test-node-1", testNode1.position); // Force position update
        canvas.moveNode("test-node-2", testNode2.position); // Force position update
      }
      
      refresh(); // Trigger re-render after adding nodes and connector
    }
  }, [canvas, refresh]);

  const handleNodeMouseDown = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    
    // Don't allow node interaction in Log Explorer mode
    if (currentMode === 'log') return;
    
    // Don't start node dragging if we're creating a connection
    if (connectionCreationState.isCreating) return;
    
    const node = canvas?.getNode(nodeId);
    if (!node || !canvas) return;

    // Track if the node was already selected before clicking
    const wasAlreadySelected = node.selected;

    // Clear any existing selections and select the node
    canvas.clearSelection();
    canvas.selectNode(nodeId);
    refresh();

    setDragState({
      isDragging: true,
      nodeId,
      startMousePos: { x: event.clientX, y: event.clientY },
      startNodePos: { x: node.position.x, y: node.position.y },
      wasAlreadySelected,
      hasDraggedNode: false
    });
  };



  const handleMouseMove = (event: React.MouseEvent) => {
    // Get mouse position relative to canvas
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    setMousePosition({ x: mouseX, y: mouseY });

    // Clear hovered endpoint if mouse moves away from the associated node's skirt area
    if (hoveredEndpoint && canvas) {
      const connector = canvas.getConnector(hoveredEndpoint.connectorId);
      if (connector) {
        const relevantNodeId = hoveredEndpoint.endpointType === 'start' 
          ? connector.startPoint.nodeId 
          : connector.endPoint.nodeId;
        
        const relevantNode = canvas.getNode(relevantNodeId);
        if (relevantNode) {
          const skirtPadding = 16; // Same as NodeComponent
          const skirtBounds = {
            x: relevantNode.position.x - skirtPadding,
            y: relevantNode.position.y - skirtPadding,
            width: relevantNode.size.width + (skirtPadding * 2),
            height: relevantNode.size.height + (skirtPadding * 2)
          };
          
          const isMouseInSkirtArea = 
            mouseX >= skirtBounds.x && 
            mouseX <= skirtBounds.x + skirtBounds.width &&
            mouseY >= skirtBounds.y && 
            mouseY <= skirtBounds.y + skirtBounds.height;
          
          if (!isMouseInSkirtArea) {
            setHoveredEndpoint(null);
          }
        }
      }
    }

    // Handle node dragging (only if not dragging endpoint or creating connection)
    if (!dragState.isDragging || !canvas || !dragState.nodeId || endpointDragState.isDragging || connectionCreationState.isCreating) return;

    const deltaX = event.clientX - dragState.startMousePos.x;
    const deltaY = event.clientY - dragState.startMousePos.y;

    // Track that actual dragging has occurred if mouse moved significantly
    const hasMovedSignificantly = Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2;
    if (hasMovedSignificantly && !dragState.hasDraggedNode) {
      setDragState(prev => ({ ...prev, hasDraggedNode: true }));
    }

    const newPosition = {
      x: dragState.startNodePos.x + deltaX,
      y: dragState.startNodePos.y + deltaY
    };

    canvas.moveNode(dragState.nodeId, newPosition);
    
    // Log connector positions for debugging
    const connectors = canvas.getAllConnectors();
    connectors.forEach(connector => {
      if (dragState.nodeId && connector.isConnectedToNode(dragState.nodeId)) {
        console.log(`Connector ${connector.id}:`);
        console.log(`  Start: nodeId=${connector.startPoint.nodeId}, absolutePos=`, connector.startPoint.absolutePosition);
        console.log(`  End: nodeId=${connector.endPoint.nodeId}, absolutePos=`, connector.endPoint.absolutePosition);
      }
    });
    
    refresh();
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      // If the node was already selected and we didn't drag it, deselect it
      if (dragState.wasAlreadySelected && !dragState.hasDraggedNode && dragState.nodeId && canvas) {
        canvas.deselectNode(dragState.nodeId);
        refresh();
      }
      
      setDragState({
        isDragging: false,
        nodeId: null,
        startMousePos: { x: 0, y: 0 },
        startNodePos: { x: 0, y: 0 },
        wasAlreadySelected: false,
        hasDraggedNode: false
      });
    }
    
    if (endpointDragState.isDragging) {
      handleEndpointDrop();
    }
    
    if (connectionCreationState.isCreating) {
      handleConnectionDrop();
    }
  };



  const handleAddNode = () => {
    if (!canvas) return;

    const newNode = new DiagramNode(
      `node-${Date.now()}`,
      "New Node",
      { x: 80, y: 100 }, // Position to the right of the plus button
      NodeType.RECTANGLE,
      { width: 120, height: 60 }
    );

    canvas.addNode(newNode);
    refresh();
  };

  // Get the currently selected components
  const selectedNode = canvas?.getSelectedNodes()[0] || null;
  const selectedConnector = canvas?.getSelectedConnectors()[0] || null;

  // Handle node updates
  const handleUpdateNode = (nodeId: string, updates: Partial<DiagramNode>) => {
    if (!canvas) return;
    
    const node = canvas.getNode(nodeId);
    if (!node) return;
    
    // Handle ID changes (requires special handling in canvas)
    if (updates.id !== undefined && updates.id !== nodeId) {
      // Check for duplicate IDs
      if (canvas.getNode(updates.id)) {
        console.error(`Node with ID "${updates.id}" already exists`);
        return;
      }
      
      // Update the node ID in the canvas
      canvas.updateNodeId(nodeId, updates.id);
    }
    
    // Update other node properties
    if (updates.title !== undefined) {
      node.updateTitle(updates.title);
    }
    
    refresh();
  };

  // Handle connector updates
  const handleUpdateConnector = (connectorId: string, updates: Partial<DiagramConnector>) => {
    if (!canvas) return;
    
    const connector = canvas.getConnector(connectorId);
    if (!connector) return;
    
    // Handle ID changes (requires special handling in canvas)
    if (updates.id !== undefined && updates.id !== connectorId) {
      // Check for duplicate IDs (check both nodes and connectors)
      if (canvas.getNode(updates.id) || canvas.getConnector(updates.id)) {
        console.error(`Component with ID "${updates.id}" already exists`);
        return;
      }
      
      // Update the connector ID in the canvas
      canvas.updateConnectorId(connectorId, updates.id);
    }
    
    // Handle other connector property updates (label, type, etc.)
    if (updates.label !== undefined) {
      connector.setLabel(updates.label);
    }
    
    if (updates.type !== undefined) {
      connector.updateType(updates.type);
    }
    
    if (updates.style !== undefined) {
      connector.updateStyle(updates.style);
    }
    
    refresh();
  };

  // Handle log entry selection
  const handleLogEntrySelect = useCallback((entry: LogEntry | null) => {
    setSelectedLogEntry(entry);
    
    if (canvas) {
      canvas.clearLogHighlights();
      
      if (entry?.unblind?.actions) {
        canvas.applyLogActions(entry.unblind.actions);
        refresh(); // Force re-render to show highlights
      }
    }
  }, [canvas, refresh]);

  // Handle connector selection
  const handleConnectorClick = (event: React.MouseEvent, connectorId: string) => {
    event.stopPropagation();
    
    // Don't allow connector interaction in Log Explorer mode
    if (currentMode === 'log') return;
    
    if (!canvas) return;
    
    // Clear any existing selections and select the connector
    canvas.clearSelection();
    canvas.selectConnector(connectorId);
    refresh();
  };


  // Hide all endpoint detection when creating connections or repositioning endpoints, or in Log Explorer mode
  const shouldShowEndpoints = !connectionCreationState.isCreating && !endpointDragState.isDragging && currentMode === 'graph';
  const availableConnectors = shouldShowEndpoints ? connectors : [];
  
  const hoveredEndpoints = getHoveredEndpoints(availableConnectors, mousePosition);
  const isHoveringEndpoint = hoveredEndpoints.length > 0;
  
  // Get log highlights from canvas
  const logHighlights = canvas?.getLogHighlights() || new Map();
  
  // Get log annotations from canvas
  const logAnnotations = canvas?.getLogAnnotations() || new Map();
  
  // Handle endpoint hover events
  const handleEndpointHover = (connectorId: string, endpointType: 'start' | 'end') => {
    setHoveredEndpoint({ connectorId, endpointType });
  };
  
  const handleEndpointHoverEnd = () => {
    setHoveredEndpoint(null);
  };
  
  // Determine cursor style based on current state
  const getCursorStyle = () => {
    if (isHoveringEndpoint) return 'pointer';
    if (connectionCreationState.isCreating) return 'crosshair';
    return 'default';
  };




  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Canvas/Container */}
      <div className="flex-1 border-r border-border relative">
        <div 
          ref={canvasRef}
          className="absolute inset-0 bg-muted/20"
          style={{ cursor: getCursorStyle() }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Grid */}
          {canvas && (
            <GridComponent
              settings={canvas.getSettings().grid}
              width={canvasSize.width}
              height={canvasSize.height}
              zoom={viewport.zoom}
              panX={viewport.panX}
              panY={viewport.panY}
            />
          )}
          
          {/* Toolbar in Top Left */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            {/* Mode Toggle Split Button */}
            <div className="flex rounded-md shadow-sm" role="group">
              <Button
                size="sm"
                variant={currentMode === 'log' ? 'default' : 'outline'}
                className={`rounded-r-none border-r-0 ${currentMode === 'log' ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setCurrentMode('log')}
              >
                Log Explorer
              </Button>
              <Button
                size="sm"
                variant={currentMode === 'graph' ? 'default' : 'outline'}
                className={`rounded-l-none ${currentMode === 'graph' ? 'bg-blue-600 text-white' : ''}`}
                onClick={() => setCurrentMode('graph')}
              >
                Graph Editor
              </Button>
            </div>
            
            {/* Graph Editor Tools - Only show in graph mode */}
            {currentMode === 'graph' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddNode}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Render Connectors */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 5 // Between grid (0) and nodes (10)
            }}
          >
            {connectors.map((connector) => {
              const startNode = canvas?.getNode(connector.startPoint.nodeId);
              const endNode = canvas?.getNode(connector.endPoint.nodeId);
              
              if (!startNode || !endNode) return null;
              
              // Use stored absolutePosition if available, otherwise calculate fresh
              const startPosition = connector.startPoint.absolutePosition || ConnectionUtils.calculateConnectionPoint(
                startNode.position,
                startNode.size,
                connector.startPoint.side,
                connector.startPoint.offset
              );
              
              const endPosition = connector.endPoint.absolutePosition || ConnectionUtils.calculateConnectionPoint(
                endNode.position,
                endNode.size,
                connector.endPoint.side,
                connector.endPoint.offset
              );
              
              // Hide connector if we're currently repositioning its endpoint
              const isBeingRepositioned = endpointDragState.isDragging && endpointDragState.connectorId === connector.id;
              
              return (
                <ConnectorComponent
                  key={connector.id}
                  connector={connector}
                  startPosition={startPosition}
                  endPosition={endPosition}
                  visible={!isBeingRepositioned}
                  logHighlight={logHighlights.get(connector.id)}
                  onConnectorClick={handleConnectorClick}
                />
              );
            })}
          </svg>
          
          {/* Render Nodes */}
          {nodes.map((node) => {
            // Check if this node should show skirt due to hovered endpoint
            const shouldShowSkirtForHoveredEndpoint = hoveredEndpoint && canvas ? (() => {
              const connector = canvas.getConnector(hoveredEndpoint.connectorId);
              if (!connector) return false;
              
              const relevantNodeId = hoveredEndpoint.endpointType === 'start' 
                ? connector.startPoint.nodeId 
                : connector.endPoint.nodeId;
              
              return relevantNodeId === node.id;
            })() : false;
            
            const shouldSuppressSkirtHover = !shouldShowSkirtForHoveredEndpoint && (
              isHoveringEndpoint || 
              (connectionCreationState.isCreating && connectionCreationState.startNodeId === node.id)
            );
            
            return (
              <NodeComponent
                key={node.id}
                node={node}
                zoom={viewport.zoom}
                onNodeMouseDown={handleNodeMouseDown}
                onSkirtMouseDown={handleSkirtMouseDown}
                suppressSkirtHover={shouldSuppressSkirtHover}
                forceSkirtHover={shouldShowSkirtForHoveredEndpoint}
                logHighlight={logHighlights.get(node.id)}
                disableHover={currentMode === 'log'}
              />
            );
          })}
          
          {/* Render Endpoint Hover Circles and Drag Preview */}
          <EndpointOverlay
            hoveredEndpoints={hoveredEndpoints}
            dragPreviewLine={getDragPreviewLine()}
            connectionPreviewLine={getConnectionPreviewLine()}
            onEndpointMouseDown={handleEndpointMouseDown}
            onEndpointHover={handleEndpointHover}
            onEndpointHoverEnd={handleEndpointHoverEnd}
          />
          
          {/* Render Annotations */}
          <AnnotationOverlay
            nodes={nodes}
            connectors={connectors}
            annotations={logAnnotations}
          />
        </div>
      </div>
      
      {/* Right Column - Mode-based Interface */}
      <div className="w-80 bg-background border-l">
        {currentMode === 'log' ? (
          <div className="h-full p-4">
            <LogViewer onLogEntrySelect={handleLogEntrySelect} />
          </div>
        ) : (
          <div className="h-full p-4">
            {selectedNode ? (
              <NodeEditor 
                node={selectedNode} 
                onUpdateNode={handleUpdateNode}
                onUpdateConnector={handleUpdateConnector}
                existingComponentIds={[...nodes.map(node => node.id), ...connectors.map(connector => connector.id)]}
              />
            ) : selectedConnector ? (
              <NodeEditor 
                connector={selectedConnector} 
                onUpdateNode={handleUpdateNode}
                onUpdateConnector={handleUpdateConnector}
                existingComponentIds={[...nodes.map(node => node.id), ...connectors.map(connector => connector.id)]}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-sm">No component selected</p>
                  <p className="text-xs mt-1">Select a node or connector to edit its properties</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
