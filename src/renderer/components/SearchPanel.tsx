import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import './SearchPanel.css';
import { SearchResult, SearchOptions } from '../services/SearchService';
import { Search, X } from 'lucide-react';

interface SearchPanelProps {
  onSearch: (text: string, options: SearchOptions) => void;
  searchResults: SearchResult[];
  currentResultIndex: number;
  onClose: () => void;
  onNavigateToResult: (result: SearchResult) => void;
  onNextResult: () => void;
  onPreviousResult: () => void;
  isSearching?: boolean;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  searchResults,
  currentResultIndex,
  onClose,
  onNavigateToResult,
  onNextResult,
  onPreviousResult,
  isSearching = false
}) => {
  const [searchText, setSearchText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [regex, setRegex] = useState(false);

  const handleSearch = () => {
    if (searchText.trim()) {
      onSearch(searchText, { caseSensitive, wholeWord, regex });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey && searchResults.length > 0) {
        onPreviousResult();
      } else if (searchResults.length > 0 && !e.ctrlKey) {
        onNextResult();
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3' || (e.ctrlKey && e.key === 'g')) {
        e.preventDefault();
        if (searchResults.length > 0) {
          if (e.shiftKey) {
            onPreviousResult();
          } else {
            onNextResult();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, onNextResult, onPreviousResult]);

  return (
    <div className="search-panel">
      <div className="search-header">
        <h3>Find in Document</h3>
        <button 
          className="close-btn" 
          onClick={onClose} 
          title="Close (Esc)"
          aria-label="Close search"
        >
          <X />
        </button>
      </div>
      <div className="search-controls">
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder="Enter search text..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            autoFocus
            disabled={isSearching}
            aria-label="Search text"
          />
          <button 
            className="search-btn" 
            onClick={handleSearch}
            disabled={!searchText.trim() || isSearching}
            title="Search (Enter)"
            aria-label="Search"
          >
            {isSearching ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <Search />
            )}
          </button>
          {searchResults.length > 0 && (
            <>
              <button 
                className="nav-btn" 
                onClick={onPreviousResult}
                title="Previous Result (Shift+Enter)"
                disabled={searchResults.length === 0}
              >
                <i className="fas fa-chevron-up"></i>
              </button>
              <button 
                className="nav-btn" 
                onClick={onNextResult}
                title="Next Result (Enter)"
                disabled={searchResults.length === 0}
              >
                <i className="fas fa-chevron-down"></i>
              </button>
            </>
          )}
        </div>
        <div className="search-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
            />
            Case Sensitive
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={wholeWord}
              onChange={(e) => setWholeWord(e.target.checked)}
            />
            Whole Word
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={regex}
              onChange={(e) => setRegex(e.target.checked)}
            />
            RegEx
          </label>
        </div>
      </div>
      <div className="search-results">
        {isSearching ? (
          <div className="searching">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Searching...</span>
          </div>
        ) : searchResults.length > 0 ? (
          <>
            <div className="results-header">
              <span>Found {searchResults.length} results</span>
              {searchResults.length > 0 && (
                <span className="result-counter">
                  {currentResultIndex + 1} of {searchResults.length}
                </span>
              )}
            </div>
            <div className="results-list">
              {searchResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`result-item ${index === currentResultIndex ? 'active' : ''}`}
                  onClick={() => onNavigateToResult(result)}
                >
                  <span className="result-page">Page {result.page}</span>
                  <SafeHighlightedText 
                    text={result.context} 
                    highlight={result.text}
                    className="result-context"
                  />
                </div>
              ))}
            </div>
          </>
        ) : searchText ? (
          <div className="no-results">
            <i className="fas fa-search"></i>
            <p>No results found for "{searchText}"</p>
            <small>Try different search terms or options</small>
          </div>
        ) : (
          <div className="search-hint">
            <i className="fas fa-info-circle"></i>
            <p>Enter text to search in the document</p>
            <small>
              Tips: Use Ctrl+F to open search, Enter for next result, Shift+Enter for previous
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

// Safe component to render highlighted text without XSS vulnerabilities
interface SafeHighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

const SafeHighlightedText: React.FC<SafeHighlightedTextProps> = ({ 
  text, 
  highlight, 
  className 
}) => {
  // Sanitize both text and highlight inputs
  const sanitizedText = DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
  const sanitizedHighlight = DOMPurify.sanitize(highlight, { ALLOWED_TAGS: [] });
  
  if (!sanitizedHighlight.trim()) {
    return <span className={className}>{sanitizedText}</span>;
  }

  // Escape regex special characters
  const escapedHighlight = sanitizedHighlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  try {
    const regex = new RegExp(`(${escapedHighlight})`, 'gi');
    const parts = sanitizedText.split(regex);
    
    return (
      <span className={className}>
        {parts.map((part, index) => {
          if (part.toLowerCase() === sanitizedHighlight.toLowerCase()) {
            return <mark key={index}>{part}</mark>;
          }
          return part;
        })}
      </span>
    );
  } catch (error) {
    // If regex fails, return unstyled text
    console.warn('Regex error in SafeHighlightedText:', error);
    return <span className={className}>{sanitizedText}</span>;
  }
};

export default SearchPanel;
