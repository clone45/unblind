// File System Access API utilities
export interface LogFile {
  name: string;
  path: string;
  handle: FileSystemFileHandle;
  lastModified: number;
  size: number;
}

export interface DirectoryInfo {
  name: string;
  path: string;
  handle: FileSystemDirectoryHandle;
}

// Check if File System Access API is supported
export const isFileSystemAccessSupported = (): boolean => {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
};

// Store directory handle in IndexedDB
export const storeDirectoryHandle = async (handle: FileSystemDirectoryHandle): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directories'], 'readwrite');
    const store = transaction.objectStore('directories');
    await store.put({ id: 'current', handle }, 'current');
  } catch (error) {
    console.error('Failed to store directory handle:', error);
  }
};

// Retrieve directory handle from IndexedDB
export const getStoredDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(['directories'], 'readonly');
    const store = transaction.objectStore('directories');
    const result = await store.get('current');
    return result?.handle || null;
  } catch (error) {
    console.error('Failed to retrieve directory handle:', error);
    return null;
  }
};

// Open IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LogViewerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('directories')) {
        db.createObjectStore('directories');
      }
    };
  });
};

// Check and request permissions for directory handle
export const checkDirectoryPermission = async (handle: FileSystemDirectoryHandle): Promise<boolean> => {
  try {
    const permission = await handle.requestPermission({ mode: 'read' });
    return permission === 'granted';
  } catch (error) {
    console.error('Permission check failed:', error);
    return false;
  }
};

// Recursively scan directory for log files
export const scanDirectoryForLogs = async (
  dirHandle: FileSystemDirectoryHandle,
  basePath: string = ''
): Promise<LogFile[]> => {
  const logFiles: LogFile[] = [];
  const logExtensions = ['.log', '.txt', '.out', '.err', '.trace', '.debug'];
  
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      const currentPath = basePath ? `${basePath}/${name}` : name;
      
      if (handle.kind === 'file') {
        // Check if file has log extension
        const hasLogExtension = logExtensions.some(ext => 
          name.toLowerCase().endsWith(ext)
        );
        
        if (hasLogExtension) {
          try {
            const file = await handle.getFile();
            logFiles.push({
              name,
              path: currentPath,
              handle,
              lastModified: file.lastModified,
              size: file.size
            });
          } catch (error) {
            console.warn(`Failed to access file ${currentPath}:`, error);
          }
        }
      } else if (handle.kind === 'directory') {
        // Recursively scan subdirectories
        try {
          const subFiles = await scanDirectoryForLogs(handle, currentPath);
          logFiles.push(...subFiles);
        } catch (error) {
          console.warn(`Failed to access directory ${currentPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Failed to scan directory:', error);
  }
  
  return logFiles.sort((a, b) => b.lastModified - a.lastModified);
};

// Read file content
export const readLogFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  try {
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (error) {
    console.error('Failed to read file:', error);
    throw error;
  }
};

// Parse log file content into log entries
export const parseLogContent = (content: string, fileName: string): any[] => {
  const lines = content.split('\n').filter(line => line.trim());
  const entries: any[] = [];
  
  lines.forEach((line, index) => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(line);
      entries.push({
        id: `${fileName}-${index}`,
        timestamp: new Date(parsed.timestamp || Date.now()),
        message: parsed.message || line,
        unblind: parsed.unblind,
        raw: line,
        source: fileName
      });
    } catch {
      // If not JSON, treat as plain text log
      entries.push({
        id: `${fileName}-${index}`,
        timestamp: new Date(),
        message: line,
        raw: line,
        source: fileName
      });
    }
  });
  
  return entries;
};

// Watch directory for changes (polling-based since native watching isn't available)
export class DirectoryWatcher {
  private handle: FileSystemDirectoryHandle | null = null;
  private lastScan: Map<string, number> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private onChangeCallback: ((files: LogFile[]) => void) | null = null;
  
  constructor(handle: FileSystemDirectoryHandle, onChange: (files: LogFile[]) => void) {
    this.handle = handle;
    this.onChangeCallback = onChange;
  }
  
  async start(intervalMs: number = 5000): Promise<void> {
    if (this.intervalId) {
      this.stop();
    }
    
    // Initial scan
    await this.checkForChanges();
    
    // Set up polling
    this.intervalId = setInterval(async () => {
      await this.checkForChanges();
    }, intervalMs);
  }
  
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  private async checkForChanges(): Promise<void> {
    if (!this.handle || !this.onChangeCallback) return;
    
    try {
      const files = await scanDirectoryForLogs(this.handle);
      let hasChanges = false;
      
      // Check for new or modified files
      for (const file of files) {
        const lastModified = this.lastScan.get(file.path);
        if (!lastModified || lastModified !== file.lastModified) {
          hasChanges = true;
          this.lastScan.set(file.path, file.lastModified);
        }
      }
      
      // Check for deleted files
      for (const [path] of this.lastScan) {
        if (!files.find(f => f.path === path)) {
          hasChanges = true;
          this.lastScan.delete(path);
        }
      }
      
      if (hasChanges) {
        this.onChangeCallback(files);
      }
    } catch (error) {
      console.error('Error checking for directory changes:', error);
    }
  }
}