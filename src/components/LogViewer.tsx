import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from '@/types/log';
import { DirectoryBrowser } from './DirectoryBrowser';
import { DirectoryInfo } from '@/utils/fileSystemAccess';

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
        status: 'processing',
        emoji: '⚠️'
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
        completion_time: '2024-01-15T18:30:02Z',
        emoji: '✅'
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
        duration_ms: 120,
        emoji: '🔗'
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
        { id: 'test-connector-1', action: 'trace' },
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
        recovery_action: 'retry',
        emoji: '❌'
      }
    }
  },
  {
    id: 'log-9',
    timestamp: new Date('2024-01-15T10:30:07'),
    message: 'Sending STOP command to TTS engine',
    unblind: {
      actions: [
        { id: 'test-connector-1', action: 'annotate', annotation: 'Sending STOP to TTS engine...' }
      ],
      data: {
        command: 'STOP',
        target: 'tts_engine',
        emoji: '🛑'
      }
    }
  },
  {
    id: 'log-10',
    timestamp: new Date('2024-01-15T10:30:08'),
    message: 'Node processing user input',
    unblind: {
      actions: [
        { id: 'test-node-1', action: 'annotate', annotation: 'Processing: "Hello world"' }
      ],
      data: {
        input_text: 'Hello world',
        processing_stage: 'tokenization',
        emoji: '💭'
      }
    }
  }
];

export const LogViewer: React.FC<LogViewerProps> = ({ onLogEntrySelect }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(mockLogEntries);
  const [currentDirectory, setCurrentDirectory] = useState<DirectoryInfo | null>(null);
  const [showDirectoryBrowser, setShowDirectoryBrowser] = useState(true);

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

  // Helper function to extract emoji from log data
  const getLogEmoji = (entry: LogEntry): string | null => {
    return entry.unblind?.data?.emoji || null;
  };

  // Handle log entries loaded from files
  const handleLogEntriesLoad = useCallback((entries: LogEntry[]) => {
    setLogEntries(entries);
    setSelectedIndex(null);
    setShowDirectoryBrowser(false);
  }, []);

  // Handle directory change
  const handleDirectoryChange = useCallback((info: DirectoryInfo | null) => {
    setCurrentDirectory(info);
    if (!info) {
      // Reset to mock data when no directory is selected
      setLogEntries(mockLogEntries);
      setShowDirectoryBrowser(true);
    }
  }, []);

  // Toggle between directory browser and log entries
  const handleBackToDirectory = () => {
    setShowDirectoryBrowser(true);
    setSelectedIndex(null);
  };

  return (
    <div className="h-full log-viewer-container flex flex-col">
      {showDirectoryBrowser ? (
        <DirectoryBrowser
          onLogEntriesLoad={handleLogEntriesLoad}
          onDirectoryChange={handleDirectoryChange}
        />
      ) : (
        <>
          <div className="pb-3 log-viewer-header">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold log-viewer-title">Log Entries</h3>
                <div className="text-sm text-muted-foreground log-viewer-subtitle">
                  {logEntries.length} entries • Use ↑↓ to navigate
                </div>
              </div>
              {currentDirectory && (
                <button
                  onClick={handleBackToDirectory}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Back to Files
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 log-viewer-content">
            <div className="h-full overflow-y-auto log-entries-container">
              {logEntries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`
                    log-entry-item px-2 py-2 border-b cursor-pointer transition-colors
                    ${selectedIndex === index
                      ? 'bg-blue-50 border-blue-200 log-entry-selected'
                      : 'hover:bg-gray-50 log-entry-unselected'
                    }
                  `}
                  onClick={() => handleEntryClick(index)}
                >
                  <div className="log-entry-content text-sm flex items-center gap-2">
                    {getLogEmoji(entry) && (
                      <span className="log-entry-emoji" role="img" aria-label="log emoji">
                        {getLogEmoji(entry)}
                      </span>
                    )}
                    <span className="log-entry-message">
                      {entry.message || 'No message'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedIndex !== null && logEntries[selectedIndex]?.unblind?.data && (
              <div className="border-t p-4 bg-gray-50 log-entry-details">
                <div className="text-sm font-medium mb-2 log-entry-details-title">Log Data:</div>
                <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32 log-entry-details-data">
                  {JSON.stringify(logEntries[selectedIndex].unblind?.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};