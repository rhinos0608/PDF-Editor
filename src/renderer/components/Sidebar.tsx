import React, { memo, useState } from 'react';
import './Sidebar.css';
import { Home, Search, FileText, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUIStore } from '../state/ui/uiStore';

const Sidebar: React.FC = () => {
  const sidebarWidth = useUIStore(state => state.sidebarWidth);
  const setSidebarWidth = useUIStore(state => state.setSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);

  // Keyboard handler for accessible resizer
  const handleResizerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setSidebarWidth(Math.max(160, sidebarWidth - 16));
    if (e.key === 'ArrowRight') setSidebarWidth(Math.min(400, sidebarWidth + 16));
    if (e.key === 'Home') setSidebarWidth(200);
  };

  // Handle drag resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(200, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Cleanup event listeners
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <aside
      style={{ width: sidebarWidth }}
      className="sidebar"
    >
      <nav>
        <button aria-label="Home" className="sidebar-btn">
          <Home />
        </button>
        <button aria-label="Search" className="sidebar-btn">
          <Search />
        </button>
        <button aria-label="Documents" className="sidebar-btn">
          <FileText />
        </button>
        <button aria-label="Settings" className="sidebar-btn">
          <Settings />
        </button>
      </nav>
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        aria-valuenow={sidebarWidth}
        aria-valuemin={160}
        aria-valuemax={400}
        onKeyDown={handleResizerKeyDown}
        onDoubleClick={() => setSidebarWidth(200)}
        title={`Sidebar width: ${sidebarWidth}px`}
        onMouseDown={handleMouseDown}
        style={{
          cursor: 'col-resize',
          outline: isResizing ? '2px solid var(--color-accent)' : 'none'
        }}
      />
    </aside>
  );
};

export default memo(Sidebar);
