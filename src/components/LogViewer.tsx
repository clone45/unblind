import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from '@/types/log';

interface LogViewerProps {
  onLogEntrySelect?: (entry: LogEntry | null) => void;
}

// Mock data for testing - using actual test node IDs
const mockLogEntries: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date('2024-01-15T10:30:00'),
    message: 'Processing started in Hello World node',
    unblind: {
      actions: [
        { id: 'test-node-1', action: 'highlight', style: 'active' }
      ],
      data: { userId: '12345', action: 'process_start' }
    }
  },
  {
    id: 'log-2',
    timestamp: new Date('2024-01-15T10:30:01'),
    message: 'Data validation in progress',
    unblind: {
      actions: [
        { id: 'test-node-1', action: 'pulse', style: 'warning' }
      ],
      data: { 
        input: 'user_data',
        validation_type: 'schema_check',
        status: 'processing'
      }
    }
  },
  {
    id: 'log-3',
    timestamp: new Date('2024-01-15T10:30:02'),
    message: 'Transferring to second node',
    unblind: {
      actions: [
        { id: 'test-node-2', action: 'focus' }
      ],
      data: {
        transfer_type: 'data_flow',
        payload_size: '1.2KB',
        execution_time_ms: 45
      }
    }
  },
  {
    id: 'log-4',
    timestamp: new Date('2024-01-15T10:30:02'),
    message: 'Processing completed successfully',
    unblind: {
      actions: [
        { id: ['test-node-1', 'test-node-2'], action: 'highlight', style: 'success' }
      ],
      data: {
        result: 'success',
        output: 'processed_data',
        completion_time: '2024-01-15T18:30:02Z'
      }
    }
  },
  {
    id: 'log-5',
    timestamp: new Date('2024-01-15T10:30:03'),
    message: 'Connection trace between nodes',
    unblind: {
      actions: [
        { id: 'test-node-1', action: 'highlight', style: 'context' },
        { id: 'test-node-2', action: 'highlight', style: 'context' },
        { id: 'test-connector-1', action: 'trace' }
      ],
      data: {
        trace_type: 'connection_path',
        duration_ms: 120
      }
    }
  },
  {
    id: 'log-6',
    timestamp: new Date('2024-01-15T10:30:04'),
    message: 'Data flowing through primary connection',
    unblind: {
      actions: [
        { id: 'test-connector-1', action: 'highlight', style: 'path' }
      ],
      data: {
        connection_id: 'test-connector-1',
        data_rate: '1.5 MB/s',
        latency_ms: 12
      }
    }
  },
  {
    id: 'log-7',
    timestamp: new Date('2024-01-15T10:30:05'),
    message: 'Bidirectional communication established',
    unblind: {
      actions: [
        { id: 'test-connector-1', action: 'bidirectional-trace' },
        { id: 'test-connector-2', action: 'highlight', style: 'active' }
      ],
      data: {
        protocol: 'bidirectional',
        connection_status: 'established',
        throughput: '2.1 MB/s'
      }
    }
  },
  {
    id: 'log-8',
    timestamp: new Date('2024-01-15T10:30:06'),
    message: 'Error handling demonstration',
    unblind: {
      actions: [
        { id: 'test-node-2', action: 'pulse', style: 'error' }
      ],
      data: {
        error_type: 'validation_failed',
        error_message: 'Invalid input format',
        recovery_action: 'retry'
      }
    }
  }
];

export const LogViewer: React.FC<LogViewerProps> = ({ onLogEntrySelect }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [logEntries] = useState<LogEntry[]>(mockLogEntries);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex(prev => {
        const newIndex = prev === null ? logEntries.length - 1 : Math.max(0, prev - 1);
        return newIndex;
      });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex(prev => {
        const newIndex = prev === null ? 0 : Math.min(logEntries.length - 1, prev + 1);
        return newIndex;
      });
    } else if (event.key === 'Escape') {
      setSelectedIndex(null);
    }
  }, [logEntries.length]);

  // Set up keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Notify parent when selection changes
  useEffect(() => {
    const selectedEntry = selectedIndex !== null ? logEntries[selectedIndex] : null;
    onLogEntrySelect?.(selectedEntry);
  }, [selectedIndex, logEntries, onLogEntrySelect]);

  const handleEntryClick = (index: number) => {
    setSelectedIndex(index);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getActionSummary = (entry: LogEntry) => {
    if (!entry.unblind?.actions) return '';
    
    const actions = entry.unblind.actions;
    const highlights = actions.filter(a => a.action === 'highlight').length;
    const other = actions.filter(a => a.action !== 'highlight').length;
    
    const parts = [];
    if (highlights > 0) parts.push(`${highlights} highlight${highlights > 1 ? 's' : ''}`);
    if (other > 0) parts.push(`${other} other${other > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Log Entries</CardTitle>
        <div className="text-sm text-muted-foreground">
          {logEntries.length} entries • Use ↑↓ to navigate
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {logEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={`
                px-4 py-3 border-b cursor-pointer transition-colors
                ${selectedIndex === index 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50'
                }
              `}
              onClick={() => handleEntryClick(index)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                    {entry.unblind?.actions && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {getActionSummary(entry)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {entry.message || 'No message'}
                  </div>
                  {entry.unblind?.actions && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {entry.unblind.actions.map((action, actionIndex) => (
                        <span key={actionIndex} className="mr-2">
                          {Array.isArray(action.id) ? action.id.join(', ') : action.id}: {action.action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {selectedIndex !== null && logEntries[selectedIndex]?.unblind?.data && (
          <div className="border-t p-4 bg-gray-50">
            <div className="text-sm font-medium mb-2">Log Data:</div>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
              {JSON.stringify(logEntries[selectedIndex].unblind?.data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};