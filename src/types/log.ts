export interface LogHighlightStyle {
  type: 'highlight' | 'focus' | 'annotate' | 'trace' | 'pulse';
  style?: 'active' | 'success' | 'error' | 'warning' | 'context' | 'destination' | 'path';
  color?: string;
  animation?: boolean;
}

export interface LogAction {
  id: string | string[];
  group?: string;
  action: 'highlight' | 'focus' | 'annotate' | 'trace' | 'pulse';
  style?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message?: string;
  unblind?: {
    actions: LogAction[];
    data?: any;
  };
}

// Helper type for processing log actions
export interface ProcessedLogAction extends LogAction {
  targetIds: string[]; // Normalized array of target IDs
  highlightStyle: LogHighlightStyle;
}