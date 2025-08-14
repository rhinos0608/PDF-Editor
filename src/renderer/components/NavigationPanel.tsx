import React, { useState, useEffect } from 'react';
import { PDFFormFieldService, NavigationTarget, FormField } from '../services/PDFFormFieldService';
import './NavigationPanel.css';

interface NavigationPanelProps {
  pdfBytes: Uint8Array | null;
  currentPage: number;
  onNavigate: (pageIndex: number, x?: number, y?: number) => void;
  onClose: () => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  pdfBytes,
  currentPage,
  onNavigate,
  onClose
}) => {
  const [targets, setTargets] = useState<NavigationTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'signatures' | 'forms' | 'bookmarks'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const formFieldService = new PDFFormFieldService();

  useEffect(() => {
    if (pdfBytes) {
      extractTargets();
    }
  }, [pdfBytes]);

  const extractTargets = async () => {
    if (!pdfBytes) return;
    
    setLoading(true);
    try {
      const navigationTargets = await formFieldService.getNavigationTargets(pdfBytes);
      setTargets(navigationTargets);
    } catch (error) {
      console.error('Error extracting navigation targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTargets = targets.filter(target => {
    // Apply type filter
    if (filter !== 'all') {
      if (filter === 'signatures' && target.type !== 'signature') return false;
      if (filter === 'forms' && target.type !== 'form') return false;
      if (filter === 'bookmarks' && target.type !== 'bookmark') return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return target.name.toLowerCase().includes(query) ||
             target.description?.toLowerCase().includes(query) ||
             target.type.toLowerCase().includes(query);
    }

    return true;
  });

  const handleTargetClick = (target: NavigationTarget) => {
    setSelectedTarget(target.id);
    onNavigate(target.pageIndex, target.x, target.y);
  };

  const getTargetIcon = (type: NavigationTarget['type']) => {
    switch (type) {
      case 'signature':
        return 'fa-signature';
      case 'form':
        return 'fa-edit';
      case 'bookmark':
        return 'fa-bookmark';
      default:
        return 'fa-map-marker';
    }
  };

  const getTargetsByType = (type: NavigationTarget['type']) => {
    return targets.filter(t => t.type === type).length;
  };

  const findNextUnfilledSignature = () => {
    const signatureTargets = targets.filter(t => t.type === 'signature');
    // For now, just return the first signature field
    // In a real implementation, you'd check if it's filled
    return signatureTargets[0] || null;
  };

  const jumpToNextSignature = () => {
    const nextSig = findNextUnfilledSignature();
    if (nextSig) {
      handleTargetClick(nextSig);
    }
  };

  return (
    <div className="navigation-panel">
      <div className="navigation-panel-header">
        <h3>
          <i className="fas fa-map-signs"></i>
          Navigation
        </h3>
        <button className="close-btn" onClick={onClose} title="Close navigation panel">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing document...</p>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="quick-actions">
            <button 
              className="quick-action-btn signature"
              onClick={jumpToNextSignature}
              disabled={getTargetsByType('signature') === 0}
              title="Jump to next signature field"
            >
              <i className="fas fa-signature"></i>
              <span>Next Signature</span>
              <span className="count">{getTargetsByType('signature')}</span>
            </button>
          </div>

          {/* Search */}
          <div className="navigation-search">
            <div className="search-input-group">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search fields, bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchQuery('')}
                  title="Clear search"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({targets.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'signatures' ? 'active' : ''}`}
              onClick={() => setFilter('signatures')}
            >
              <i className="fas fa-signature"></i>
              Signatures ({getTargetsByType('signature')})
            </button>
            <button 
              className={`filter-tab ${filter === 'forms' ? 'active' : ''}`}
              onClick={() => setFilter('forms')}
            >
              <i className="fas fa-edit"></i>
              Forms ({getTargetsByType('form')})
            </button>
            <button 
              className={`filter-tab ${filter === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setFilter('bookmarks')}
            >
              <i className="fas fa-bookmark"></i>
              Bookmarks ({getTargetsByType('bookmark')})
            </button>
          </div>

          {/* Target List */}
          <div className="target-list">
            {filteredTargets.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-search"></i>
                <p>
                  {searchQuery ? 'No matches found' : 
                   filter === 'all' ? 'No navigation targets found' :
                   `No ${filter} found in this document`}
                </p>
              </div>
            ) : (
              filteredTargets.map((target) => (
                <div
                  key={target.id}
                  className={`target-item ${selectedTarget === target.id ? 'selected' : ''} ${target.pageIndex === currentPage ? 'current-page' : ''}`}
                  onClick={() => handleTargetClick(target)}
                >
                  <div className="target-icon">
                    <i className={`fas ${getTargetIcon(target.type)}`}></i>
                  </div>
                  <div className="target-content">
                    <div className="target-name">{target.name}</div>
                    <div className="target-meta">
                      <span className="target-page">Page {target.pageIndex + 1}</span>
                      {target.description && (
                        <span className="target-description">{target.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="target-actions">
                    {target.pageIndex === currentPage && (
                      <span className="current-indicator" title="Current page">
                        <i className="fas fa-eye"></i>
                      </span>
                    )}
                    <button 
                      className="goto-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTargetClick(target);
                      }}
                      title="Go to this location"
                    >
                      <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary */}
          <div className="navigation-summary">
            <div className="summary-item">
              <strong>{filteredTargets.length}</strong> of {targets.length} items shown
            </div>
            {searchQuery && (
              <div className="summary-item">
                Filtering by: "{searchQuery}"
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NavigationPanel;