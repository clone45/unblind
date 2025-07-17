'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { NodeComponent } from "@/components/NodeComponent";
import { GridComponent } from "@/components/GridComponent";
import { ConnectorComponent } from "@/components/ConnectorComponent";
import { DiagramNode, NodeType } from "@/types/node";
import { ConnectionUtils, ConnectionSide } from "@/types/connector";
import { useEffect, useState, useRef } from "react";

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startMousePos: { x: number; y: number };
  startNodePos: { x: number; y: number };
}

export default function Home() {
  const { canvas, nodes, connectors, viewport, refresh } = useCanvas();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startMousePos: { x: 0, y: 0 },
    startNodePos: { x: 0, y: 0 }
  });

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
      
      const testConnector1 = canvas.createConnector("test-node-1", "test-node-2");
      const testConnector2 = canvas.createConnector("test-node-2", "test-node-1");
      
      // Force different connection sides to make both visible
      if (testConnector1) {
        testConnector1.startPoint.side = ConnectionSide.RIGHT;
        testConnector1.endPoint.side = ConnectionSide.LEFT;
      }
      if (testConnector2) {
        testConnector2.startPoint.side = ConnectionSide.TOP;
        testConnector2.endPoint.side = ConnectionSide.BOTTOM;
      }
      
      // Configure first connector
      if (testConnector1) {
        testConnector1.style.arrowStart = false;
        testConnector1.style.arrowEnd = true;
      }
      
      // Configure second connector (opposite direction)
      if (testConnector2) {
        testConnector2.style.arrowStart = false;
        testConnector2.style.arrowEnd = true;
      }
      
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
    const node = canvas?.getNode(nodeId);
    if (!node) return;

    setDragState({
      isDragging: true,
      nodeId,
      startMousePos: { x: event.clientX, y: event.clientY },
      startNodePos: { x: node.position.x, y: node.position.y }
    });
  };

  const handleSkirtClick = (event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    console.log('Skirt clicked on node:', nodeId);
    // TODO: Implement connection creation logic
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    // Get mouse position relative to canvas
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    setMousePosition({ x: mouseX, y: mouseY });

    // Debug: Check for collisions
    const hoveredEndpoints = getHoveredEndpoints();
    if (hoveredEndpoints.length > 0) {
      console.log('Hovering over connector endpoints:', hoveredEndpoints.map(e => `${e.connectorId}-${e.point}`));
    }

    // Handle node dragging
    if (!dragState.isDragging || !canvas || !dragState.nodeId) return;

    const deltaX = event.clientX - dragState.startMousePos.x;
    const deltaY = event.clientY - dragState.startMousePos.y;

    const newPosition = {
      x: dragState.startNodePos.x + deltaX,
      y: dragState.startNodePos.y + deltaY
    };

    canvas.moveNode(dragState.nodeId, newPosition);
    
    // Log connector positions for debugging
    const connectors = canvas.getAllConnectors();
    connectors.forEach(connector => {
      if (connector.isConnectedToNode(dragState.nodeId)) {
        console.log(`Connector ${connector.id}:`);
        console.log(`  Start: nodeId=${connector.startPoint.nodeId}, absolutePos=`, connector.startPoint.absolutePosition);
        console.log(`  End: nodeId=${connector.endPoint.nodeId}, absolutePos=`, connector.endPoint.absolutePosition);
      }
    });
    
    refresh();
  };

  const handleMouseUp = () => {
    if (dragState.isDragging) {
      setDragState({
        isDragging: false,
        nodeId: null,
        startMousePos: { x: 0, y: 0 },
        startNodePos: { x: 0, y: 0 }
      });
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

  // Get connector endpoints that are near the mouse
  const getHoveredEndpoints = () => {
    const hoveredEndpoints: Array<{ connectorId: string; point: 'start' | 'end'; position: { x: number; y: number } }> = [];
    const hoverRadius = 15; // Pixels

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

  const hoveredEndpoints = getHoveredEndpoints();
  const isHoveringEndpoint = hoveredEndpoints.length > 0;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Canvas/Container */}
      <div className="flex-1 border-r border-border relative">
        <div 
          className="absolute inset-0 bg-muted/20"
          style={{ cursor: isHoveringEndpoint ? 'pointer' : 'default' }}
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
          
          {/* Plus Button in Top Left */}
          <Button
            size="sm"
            className="absolute top-4 left-4 z-10"
            variant="outline"
            onClick={handleAddNode}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
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
              
              return (
                <ConnectorComponent
                  key={connector.id}
                  connector={connector}
                  startPosition={startPosition}
                  endPosition={endPosition}
                />
              );
            })}
          </svg>
          
          {/* Render Nodes */}
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              zoom={viewport.zoom}
              onNodeMouseDown={handleNodeMouseDown}
              onSkirtClick={handleSkirtClick}
              suppressSkirtHover={isHoveringEndpoint}
            />
          ))}
          
          {/* Render Endpoint Hover Circles */}
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
            {getHoveredEndpoints().map((endpoint, index) => (
              <circle
                key={`${endpoint.connectorId}-${endpoint.point}-${index}`}
                cx={endpoint.position.x}
                cy={endpoint.position.y}
                r={12}
                fill="rgba(0, 0, 0, 0.3)"
                stroke="rgba(0, 0, 0, 0.6)"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>
      </div>
      
      {/* Right Column - Properties/Tools Panel */}
      <div className="w-80 bg-background p-6">
        <Card>
          <CardHeader>
            <CardTitle>Diagramming System</CardTitle>
            <CardDescription>
              Create and edit diagrams with ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the + button to add elements to your diagram.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
