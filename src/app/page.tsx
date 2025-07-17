'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCanvas } from "@/hooks/useCanvas";
import { NodeComponent } from "@/components/NodeComponent";
import { GridComponent } from "@/components/GridComponent";
import { DiagramNode, NodeType } from "@/types/node";
import { useEffect, useState, useRef } from "react";

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startMousePos: { x: number; y: number };
  startNodePos: { x: number; y: number };
}

export default function Home() {
  const { canvas, nodes, viewport, refresh } = useCanvas();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
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

  // Add a test node when canvas is ready
  useEffect(() => {
    if (canvas) {
      const testNode = new DiagramNode(
        "test-node-1",
        "Hello World",
        { x: 100, y: 100 },
        NodeType.RECTANGLE,
        { width: 120, height: 60 }
      );
      canvas.addNode(testNode);
      refresh(); // Trigger re-render after adding node
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

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!dragState.isDragging || !canvas || !dragState.nodeId) return;

    const deltaX = event.clientX - dragState.startMousePos.x;
    const deltaY = event.clientY - dragState.startMousePos.y;

    const newPosition = {
      x: dragState.startNodePos.x + deltaX,
      y: dragState.startNodePos.y + deltaY
    };

    canvas.moveNode(dragState.nodeId, newPosition);
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Column - Canvas/Container */}
      <div className="flex-1 border-r border-border relative">
        <div 
          className="absolute inset-0 bg-muted/20"
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
          
          {/* Render Nodes */}
          {nodes.map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              zoom={viewport.zoom}
              onMouseDown={handleNodeMouseDown}
            />
          ))}
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
