/// <reference types="node" />
/// <reference types="electron" />
/// <reference types="react" />
/// <reference types="react-dom" />

// Node.js process global
declare namespace NodeJS {
  interface Process extends NodeJS.Process {
    env: ProcessEnv;
    platform: string;
    versions: {
      node: string;
      chrome: string;
      electron: string;
    };
  }

  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    ELECTRON_DISABLE_SECURITY_WARNINGS?: string;
    [key: string]: string | undefined;
  }
}

declare const __dirname: string;
declare const __filename: string;

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Electron API exposed to renderer
interface ElectronAPI {
  // Development flag
  isDev: boolean;
  
  // File operations
  openFile: () => Promise<{ path: string; data: ArrayBuffer } | null>;
  saveFileDialog: (defaultPath?: string) => Promise<string | null>;
  saveFile: (filePath: string, data: ArrayBuffer) => Promise<{ success: boolean; error?: string }>;
  
  // Preferences
  getPreferences: () => Promise<any>;
  setPreferences: (preferences: any) => Promise<{ success: boolean }>;
  
  // Recent files
  getRecentFiles: () => Promise<string[]>;
  addRecentFile: (filePath: string) => Promise<string[]>;
  
  // Menu actions
  onMenuAction: (callback: (action: string) => void) => void;
  removeAllListeners: () => void;
  
  // Utility
  log: (level: 'info' | 'warn' | 'error', ...args: any[]) => void;
}

// Window interface extension
interface Window {
  electronAPI: ElectronAPI;
  fs: {
    readFile: (path: string, options?: { encoding?: string }) => Promise<ArrayBuffer | string>;
    writeFile: (path: string, data: ArrayBuffer | string) => Promise<void>;
  };
}

// PDF.js types
declare module 'pdfjs-dist' {
  export * from 'pdfjs-dist/types/src/pdf';
  export * from 'pdfjs-dist/types/src/display/api';
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export const version: string;
}

// Module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.pdf' {
  const content: ArrayBuffer;
  export default content;
}

// Custom types
type PDFTool = 
  | 'select'
  | 'text'
  | 'highlight'
  | 'underline'
  | 'strikethrough'
  | 'draw'
  | 'shapes'
  | 'arrow'
  | 'note'
  | 'stamp'
  | 'signature'
  | 'eraser'
  | 'redact';

type PDFViewMode = 
  | 'single'
  | 'continuous'
  | 'two-page'
  | 'book';

type Theme = 'light' | 'dark';

interface PDFEditorPreferences {
  theme: Theme;
  autoSave: boolean;
  autoSaveInterval: number;
  language: string;
  defaultZoom: number;
  showThumbnails: boolean;
  highlightColor: string;
  defaultFont: string;
  viewMode: PDFViewMode;
  recentFilesLimit: number;
  enableShortcuts: boolean;
  enableAnimations: boolean;
  compressionQuality: 'low' | 'medium' | 'high';
}

interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount?: number;
  fileSize?: number;
}

interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
  annotations: number;
}

// Export types
export {
  PDFTool,
  PDFViewMode,
  Theme,
  PDFEditorPreferences,
  PDFMetadata,
  PDFPageInfo
};
