import React, { useState } from 'react';
import { LogViewer } from './LogViewer';
import { NodeEditor } from './NodeEditor';
import { DiagramNode } from '@/types/node';
import { DiagramConnector } from '@/types/connector';
import { LogEntry } from '@/types/log';

interface RightPanelTabsProps {
  selectedNode: DiagramNode | null;
  selectedConnector: DiagramConnector | null;
  onUpdateNode: (nodeId: string, updates: Partial<DiagramNode>) => void;
  onUpdateConnector: (connectorId: string, updates: Partial<DiagramConnector>) => void;
  onLogEntrySelect: (entry: LogEntry | null) => void;
  existingComponentIds?: string[];
}

type TabType = 'logs' | 'node';

export const RightPanelTabs: React.FC<RightPanelTabsProps> = ({
  selectedNode,
  selectedConnector,
  onUpdateNode,
  onUpdateConnector,
  onLogEntrySelect,
  existingComponentIds = []
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('logs');

  // Switch back to logs tab when neither node nor connector is selected while on node tab
  React.useEffect(() => {
    if (!selectedNode && !selectedConnector && activeTab === 'node') {
      setActiveTab('logs');
    }
  }, [selectedNode, selectedConnector, activeTab]);

  const tabButtonClass = (isActive: boolean, isDisabled: boolean = false) => `
    px-4 py-2 text-sm font-medium transition-colors
    ${isActive 
      ? 'bg-blue-500 text-white' 
      : isDisabled
        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  `;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Header */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('logs')}
          className={`${tabButtonClass(activeTab === 'logs', false)} rounded-tl-lg`}
        >
          Log Entries
        </button>
        <button
          onClick={() => setActiveTab('node')}
          className={`${tabButtonClass(activeTab === 'node', !selectedNode && !selectedConnector)} rounded-tr-lg`}
          disabled={!selectedNode && !selectedConnector}
        >
          Component Editor
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'logs' && (
          <div className="h-full p-4">
            <LogViewer onLogEntrySelect={onLogEntrySelect} />
          </div>
        )}
        
        {activeTab === 'node' && selectedNode && (
          <div className="h-full p-4">
            <NodeEditor 
              node={selectedNode} 
              onUpdateNode={onUpdateNode}
              onUpdateConnector={onUpdateConnector}
              existingComponentIds={existingComponentIds}
            />
          </div>
        )}
        
        {activeTab === 'node' && selectedConnector && (
          <div className="h-full p-4">
            <NodeEditor 
              connector={selectedConnector} 
              onUpdateNode={onUpdateNode}
              onUpdateConnector={onUpdateConnector}
              existingComponentIds={existingComponentIds}
            />
          </div>
        )}
        
        {activeTab === 'node' && !selectedNode && !selectedConnector && (
          <div className="h-full p-4 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-sm">No component selected</p>
              <p className="text-xs mt-1">Select a component to edit its properties</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};