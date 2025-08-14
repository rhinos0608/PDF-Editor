import React, { useState } from 'react';
import './BookmarksPanel.css';

interface BookmarksPanelProps {
  bookmarks: any[];
  currentPage: number;
  onNavigate: (page: number) => void;
  onAddBookmark: (title: string, page: number) => void;
  onClose: () => void;
}

const BookmarksPanel: React.FC<BookmarksPanelProps> = ({ 
  bookmarks, 
  currentPage, 
  onNavigate, 
  onAddBookmark,
  onClose 
}) => {
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBookmarkTitle.trim()) {
      onAddBookmark(newBookmarkTitle.trim(), currentPage);
      setNewBookmarkTitle('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="bookmarks-panel">
      <div className="bookmarks-header">
        <h3>Bookmarks</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="bookmarks-content">
        <div className="bookmarks-actions">
          <button 
            className="btn btn-secondary btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Bookmark'}
          </button>
        </div>
        
        {showAddForm && (
          <form className="add-bookmark-form" onSubmit={handleAddBookmark}>
            <input
              type="text"
              value={newBookmarkTitle}
              onChange={(e) => setNewBookmarkTitle(e.target.value)}
              placeholder="Bookmark title"
              autoFocus
            />
            <button type="submit" className="btn btn-primary btn-small">
              Add
            </button>
          </form>
        )}
        
        <div className="bookmarks-list">
          {bookmarks.length > 0 ? (
            bookmarks.map((bookmark) => (
              <div 
                key={bookmark.id}
                className={`bookmark-item ${bookmark.page === currentPage ? 'active' : ''}`}
                onClick={() => onNavigate(bookmark.page)}
              >
                <div className="bookmark-title">{bookmark.title}</div>
                <div className="bookmark-page">Page {bookmark.page}</div>
              </div>
            ))
          ) : (
            <div className="bookmarks-empty">
              <p>No bookmarks yet</p>
              <p>Click "Add Bookmark" to create your first bookmark</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookmarksPanel;