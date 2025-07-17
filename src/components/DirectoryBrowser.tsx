import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, RefreshCw, Upload, AlertCircle, File, Folder } from "lucide-react";
import {
  isFileSystemAccessSupported,
  storeDirectoryHandle,
  getStoredDirectoryHandle,
  checkDirectoryPermission,
  scanDirectoryForLogs,
  readLogFile,
  parseLogContent,
  DirectoryWatcher,
  LogFile,
  DirectoryInfo
} from '@/utils/fileSystemAccess';
import { LogEntry } from '@/types/log';

interface DirectoryBrowserProps {
  onLogEntriesLoad: (entries: LogEntry[]) => void;
  onDirectoryChange: (info: DirectoryInfo | null) => void;
}

export const DirectoryBrowser: React.FC<DirectoryBrowserProps> = ({
  onLogEntriesLoad,
  onDirectoryChange
}) => {
  const [isSupported] = useState(isFileSystemAccessSupported());
  const [currentDirectory, setCurrentDirectory] = useState<DirectoryInfo | null>(null);
  const [logFiles, setLogFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LogFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watcher, setWatcher] = useState<DirectoryWatcher | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Initialize - check for stored directory on mount
  useEffect(() => {
    initializeDirectory();
  }, []);

  // Cleanup watcher on unmount
  useEffect(() => {
    return () => {
      if (watcher) {
        watcher.stop();
      }
    };
  }, [watcher]);

  const initializeDirectory = async () => {
    if (!isSupported) return;
    
    try {
      const storedHandle = await getStoredDirectoryHandle();
      if (storedHandle) {
        const hasPermission = await checkDirectoryPermission(storedHandle);
        if (hasPermission) {
          await setDirectoryHandle(storedHandle);
        } else {
          setError('Permission denied for stored directory. Please select a new directory.');
        }
      }
    } catch (error) {
      console.error('Failed to initialize directory:', error);
    }
  };

  const setDirectoryHandle = async (handle: FileSystemDirectoryHandle) => {
    try {
      setIsLoading(true);
      setError(null);

      const directoryInfo: DirectoryInfo = {
        name: handle.name,
        path: handle.name,
        handle
      };

      setCurrentDirectory(directoryInfo);
      onDirectoryChange(directoryInfo);

      // Scan for log files
      const files = await scanDirectoryForLogs(handle);
      setLogFiles(files);

      // Set up file watcher
      if (watcher) {
        watcher.stop();
      }
      
      const newWatcher = new DirectoryWatcher(handle, (updatedFiles) => {
        setLogFiles(updatedFiles);
        console.log(`Directory updated: ${updatedFiles.length} log files found`);
      });
      
      await newWatcher.start();
      setWatcher(newWatcher);

      // Store handle for persistence
      await storeDirectoryHandle(handle);
      
    } catch (error) {
      setError(`Failed to access directory: ${error}`);
      console.error('Directory access error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDirectory = async () => {
    if (!isSupported || typeof window === 'undefined') return;

    try {
      setError(null);
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'read'
      });
      
      await setDirectoryHandle(dirHandle);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setError(`Failed to open directory: ${error.message}`);
      }
    }
  };

  const handleRefreshDirectory = async () => {
    if (!currentDirectory) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const hasPermission = await checkDirectoryPermission(currentDirectory.handle);
      if (!hasPermission) {
        setError('Permission denied. Please reselect the directory.');
        return;
      }

      const files = await scanDirectoryForLogs(currentDirectory.handle);
      setLogFiles(files);
    } catch (error) {
      setError(`Failed to refresh directory: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: LogFile) => {
    try {
      setIsLoading(true);
      setSelectedFile(file);
      
      const content = await readLogFile(file.handle);
      const entries = parseLogContent(content, file.name);
      
      // Convert to LogEntry format
      const logEntries: LogEntry[] = entries.map(entry => ({
        id: entry.id,
        timestamp: entry.timestamp,
        message: entry.message,
        unblind: entry.unblind
      }));
      
      onLogEntriesLoad(logEntries);
    } catch (error) {
      setError(`Failed to read file: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeDirectory = () => {
    if (watcher) {
      watcher.stop();
      setWatcher(null);
    }
    setCurrentDirectory(null);
    setLogFiles([]);
    setSelectedFile(null);
    onDirectoryChange(null);
    handleOpenDirectory();
  };

  // Drag and drop handlers for fallback
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const logFiles = files.filter(file => 
      ['.log', '.txt', '.out', '.err', '.trace', '.debug'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    if (logFiles.length === 0) {
      setError('No log files found in dropped files');
      return;
    }

    try {
      setIsLoading(true);
      const allEntries: LogEntry[] = [];

      for (const file of logFiles) {
        const content = await file.text();
        const entries = parseLogContent(content, file.name);
        
        const logEntries: LogEntry[] = entries.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp,
          message: entry.message,
          unblind: entry.unblind
        }));
        
        allEntries.push(...logEntries);
      }

      // Sort by timestamp
      allEntries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      onLogEntriesLoad(allEntries);
      
    } catch (error) {
      setError(`Failed to process dropped files: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [onLogEntriesLoad]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (!isSupported) {
    return (
      <div className="directory-browser-fallback">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              File System Access Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Your browser doesn't support the File System Access API. 
              Use Chrome or Edge for the full experience, or drag and drop log files below.
            </p>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Drop log files here</p>
              <p className="text-sm text-muted-foreground">
                Supports .log, .txt, .out, .err, .trace, .debug files
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="directory-browser h-full flex flex-col">
      {/* Directory Controls */}
      <div className="directory-controls mb-4 space-y-2">
        {!currentDirectory ? (
          <Button onClick={handleOpenDirectory} className="w-full">
            <FolderOpen className="h-4 w-4 mr-2" />
            Open Log Directory
          </Button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium truncate" title={currentDirectory.path}>
                  {currentDirectory.name}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshDirectory}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleChangeDirectory}
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {logFiles.length} log files found
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-display mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* File List */}
      {currentDirectory && (
        <div className="file-list flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto space-y-1">
            {logFiles.map((file) => (
              <div
                key={file.path}
                className={`file-item p-2 rounded cursor-pointer transition-colors ${
                  selectedFile?.path === file.path
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate" title={file.path}>
                      {file.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {formatDate(file.lastModified)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {logFiles.length === 0 && currentDirectory && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No log files found</p>
                <p className="text-xs">Looking for .log, .txt, .out, .err, .trace, .debug files</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="loading-state text-center py-4">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      )}
    </div>
  );
};