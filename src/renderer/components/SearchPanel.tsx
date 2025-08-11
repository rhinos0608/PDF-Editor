import React, { useState } from 'react';
import './SearchPanel.css';

interface SearchPanelProps {
  onSearch: (text: string) => void;
  searchResults: any[];
  onClose: () => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({
  onSearch,
  searchResults,
  onClose
}) => {
  const [searchText, setSearchText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const handleSearch = () => {
    onSearch(searchText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-panel">
      <div className="search-header">
        <h3>Find in Document</h3>
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
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
          />
          <button className="search-btn" onClick={handleSearch}>
            <i className="fas fa-search"></i>
          </button>
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
        </div>
      </div>
      <div className="search-results">
        {searchResults.length > 0 ? (
          <>
            <div className="results-header">
              Found {searchResults.length} results
            </div>
            <div className="results-list">
              {searchResults.map((result, index) => (
                <div key={index} className="result-item">
                  <span className="result-page">Page {result.page}</span>
                  <span className="result-text">{result.text}</span>
                </div>
              ))}
            </div>
          </>
        ) : searchText ? (
          <div className="no-results">No results found</div>
        ) : (
          <div className="search-hint">Enter text to search in the document</div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;
