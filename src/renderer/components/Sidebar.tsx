import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  onToggleThumbnails: () => void;
  onToggleProperties: () => void;
  onToggleSearch: () => void;
  showThumbnails: boolean;
  showProperties: boolean;
  showSearch: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onToggleThumbnails,
  onToggleProperties,
  onToggleSearch,
  showThumbnails,
  showProperties,
  showSearch
}) => {
  return (
    <div className="sidebar">
      <button
        className={`sidebar-btn ${showThumbnails ? 'active' : ''}`}
        onClick={onToggleThumbnails}
        title="Thumbnails"
      >
        <i className="fas fa-th"></i>
      </button>
      <button
        className={`sidebar-btn ${showSearch ? 'active' : ''}`}
        onClick={onToggleSearch}
        title="Search"
      >
        <i className="fas fa-search"></i>
      </button>
      <button
        className={`sidebar-btn ${showProperties ? 'active' : ''}`}
        onClick={onToggleProperties}
        title="Properties"
      >
        <i className="fas fa-info-circle"></i>
      </button>
      <button className="sidebar-btn" title="Bookmarks">
        <i className="fas fa-bookmark"></i>
      </button>
      <button className="sidebar-btn" title="Attachments">
        <i className="fas fa-paperclip"></i>
      </button>
      <button className="sidebar-btn" title="Comments">
        <i className="fas fa-comment"></i>
      </button>
      <button className="sidebar-btn" title="Signatures">
        <i className="fas fa-file-signature"></i>
      </button>
      <button className="sidebar-btn" title="Forms">
        <i className="fas fa-wpforms"></i>
      </button>
      <button className="sidebar-btn" title="Layers">
        <i className="fas fa-layer-group"></i>
      </button>
    </div>
  );
};

export default Sidebar;
