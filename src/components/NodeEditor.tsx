import React, { useState, useEffect } from 'react';
import { DiagramNode } from '@/types/node';
import { DiagramConnector } from '@/types/connector';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface NodeEditorProps {
  node?: DiagramNode;
  connector?: DiagramConnector;
  onUpdateNode: (nodeId: string, updates: Partial<DiagramNode>) => void;
  onUpdateConnector?: (connectorId: string, updates: Partial<DiagramConnector>) => void;
  existingComponentIds?: string[];
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, connector, onUpdateNode, onUpdateConnector, existingComponentIds = [] }) => {
  const selectedItem = node || connector;
  
  const [text, setText] = useState(node?.title || '');
  const [itemId, setItemId] = useState(selectedItem?.id || '');
  const [idError, setIdError] = useState<string | null>(null);

  // Update local state when node or connector changes
  useEffect(() => {
    setText(node?.title || '');
    setItemId(selectedItem?.id || '');
    setIdError(null);
  }, [node?.title, node?.id, connector?.id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Update the node immediately (only works for nodes, not connectors)
    if (node) {
      onUpdateNode(node.id, { title: newText });
    }
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value;
    setItemId(newId);
    
    // Clear previous error
    setIdError(null);
    
    // Basic validation
    if (newId.trim() === '') {
      setIdError('ID cannot be empty');
      return;
    }
    
    // Check for invalid characters (basic validation)
    if (!/^[a-zA-Z0-9_-]+$/.test(newId)) {
      setIdError('ID can only contain letters, numbers, hyphens, and underscores');
      return;
    }
    
    // Check for duplicate IDs (excluding the current item)
    if (newId !== selectedItem?.id && existingComponentIds.includes(newId)) {
      setIdError('A component with this ID already exists');
      return;
    }
    
    // Only update if the ID is different from the current item ID
    if (newId !== selectedItem?.id) {
      if (node) {
        onUpdateNode(node.id, { id: newId });
      } else if (connector && onUpdateConnector) {
        onUpdateConnector(connector.id, { id: newId });
      }
    }
  };

  if (!selectedItem) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Component Properties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No component selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Component Properties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="component-id" className="text-sm font-medium">
            {node ? 'Node' : 'Connector'} ID
          </label>
          <input
            id="component-id"
            type="text"
            value={itemId}
            onChange={handleIdChange}
            placeholder={`Enter ${node ? 'node' : 'connector'} ID...`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              idError 
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          {idError && (
            <p className="text-sm text-red-600">{idError}</p>
          )}
        </div>
        
        {node && (
          <div className="space-y-2">
            <label htmlFor="node-text" className="text-sm font-medium">
              Text
            </label>
            <input
              id="node-text"
              type="text"
              value={text}
              onChange={handleTextChange}
              placeholder="Enter node text..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          {node && (
            <>
              <p>Position: ({Math.round(node.position.x)}, {Math.round(node.position.y)})</p>
              <p>Size: {node.size.width} × {node.size.height}</p>
            </>
          )}
          {connector && (
            <>
              <p>Type: {connector.type}</p>
              <p>From: {connector.startPoint.nodeId}</p>
              <p>To: {connector.endPoint.nodeId}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};