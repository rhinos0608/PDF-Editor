import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  ArrowRight,
  Eye,
  Download,
  Settings,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  AlertCircle,
  FileIcon,
  Plus,
  Minus,
  Edit,
  RotateCcw,
  Save,
  Share2,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import './DocumentComparison.css';

interface ComparisonResult {
  id: string;
  type: 'text' | 'image' | 'formatting' | 'structure';
  severity: 'major' | 'minor' | 'info';
  description: string;
  location: {
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  };
  oldValue?: string;
  newValue?: string;
  confidence: number;
}

interface ComparisonSummary {
  totalChanges: number;
  textChanges: number;
  imageChanges: number;
  formattingChanges: number;
  structureChanges: number;
  addedContent: number;
  deletedContent: number;
  modifiedContent: number;
}

interface DocumentComparisonProps {
  isVisible: boolean;
  onClose: () => void;
  onReportGenerated?: (reportBytes: Uint8Array) => void;
}

const DocumentComparison: React.FC<DocumentComparisonProps> = ({
  isVisible,
  onClose,
  onReportGenerated
}) => {
  const [originalDocument, setOriginalDocument] = useState<File | null>(null);
  const [revisedDocument, setRevisedDocument] = useState<File | null>(null);
  const [originalBytes, setOriginalBytes] = useState<Uint8Array | null>(null);
  const [revisedBytes, setRevisedBytes] = useState<Uint8Array | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [comparisonSummary, setComparisonSummary] = useState<ComparisonSummary | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ComparisonResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'image' | 'formatting' | 'structure'>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'major' | 'minor' | 'info'>('all');
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay' | 'changes-only'>('side-by-side');
  const [showDeleted, setShowDeleted] = useState(true);
  const [showAdded, setShowAdded] = useState(true);
  const [showModified, setShowModified] = useState(true);
  const [comparisonSettings, setComparisonSettings] = useState({
    ignoreWhitespace: false,
    ignoreFormatting: false,
    ignoreCaseChanges: false,
    detectMovedText: true,
    highlightImages: true,
    compareMetadata: true,
    sensitivityLevel: 'medium' as 'low' | 'medium' | 'high'
  });
  
  const originalFileRef = useRef<HTMLInputElement>(null);
  const revisedFileRef = useRef<HTMLInputElement>(null);
  const comparisonViewRef = useRef<HTMLDivElement>(null);

  const handleFileSelection = useCallback(async (file: File, type: 'original' | 'revised') => {
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a PDF file.');
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    if (type === 'original') {
      setOriginalDocument(file);
      setOriginalBytes(bytes);
    } else {
      setRevisedDocument(file);
      setRevisedBytes(bytes);
    }

    // Clear previous results when new files are loaded
    setComparisonResults([]);
    setComparisonSummary(null);
    setSelectedResult(null);
  }, []);

  const performComparison = useCallback(async () => {
    if (!originalBytes || !revisedBytes) {
      alert('Please select both documents to compare.');
      return;
    }

    setIsComparing(true);
    
    try {
      // Simulate Adobe-level document comparison
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing time
      
      const mockResults: ComparisonResult[] = [
        {
          id: '1',
          type: 'text',
          severity: 'major',
          description: 'Text content changed in paragraph',
          location: { page: 1, x: 100, y: 200, width: 300, height: 50 },
          oldValue: 'Original contract terms and conditions',
          newValue: 'Revised contract terms and updated conditions',
          confidence: 0.95
        },
        {
          id: '2',
          type: 'text',
          severity: 'minor',
          description: 'Date formatting changed',
          location: { page: 1, x: 400, y: 150, width: 100, height: 20 },
          oldValue: '12/31/2024',
          newValue: 'December 31, 2024',
          confidence: 0.99
        },
        {
          id: '3',
          type: 'structure',
          severity: 'major',
          description: 'New section added',
          location: { page: 2, x: 50, y: 100, width: 500, height: 200 },
          newValue: 'Section 5: Additional Terms and Conditions',
          confidence: 1.0
        },
        {
          id: '4',
          type: 'formatting',
          severity: 'minor',
          description: 'Font size changed',
          location: { page: 1, x: 100, y: 300, width: 200, height: 30 },
          oldValue: '12pt',
          newValue: '14pt',
          confidence: 0.88
        },
        {
          id: '5',
          type: 'image',
          severity: 'info',
          description: 'Logo updated',
          location: { page: 1, x: 50, y: 50, width: 100, height: 80 },
          confidence: 0.92
        }
      ];

      const summary: ComparisonSummary = {
        totalChanges: mockResults.length,
        textChanges: mockResults.filter(r => r.type === 'text').length,
        imageChanges: mockResults.filter(r => r.type === 'image').length,
        formattingChanges: mockResults.filter(r => r.type === 'formatting').length,
        structureChanges: mockResults.filter(r => r.type === 'structure').length,
        addedContent: mockResults.filter(r => r.newValue && !r.oldValue).length,
        deletedContent: mockResults.filter(r => r.oldValue && !r.newValue).length,
        modifiedContent: mockResults.filter(r => r.oldValue && r.newValue).length
      };

      setComparisonResults(mockResults);
      setComparisonSummary(summary);
      
    } catch (error) {
      console.error('Comparison failed:', error);
      alert('Document comparison failed. Please try again.');
    } finally {
      setIsComparing(false);
    }
  }, [originalBytes, revisedBytes]);

  const generateComparisonReport = useCallback(async () => {
    if (!comparisonResults.length) {
      alert('No comparison results to generate report from.');
      return;
    }

    try {
      // Create a comprehensive comparison report
      const reportContent = `
# Document Comparison Report

## Summary
- Total Changes: ${comparisonSummary?.totalChanges || 0}
- Text Changes: ${comparisonSummary?.textChanges || 0}
- Image Changes: ${comparisonSummary?.imageChanges || 0}
- Formatting Changes: ${comparisonSummary?.formattingChanges || 0}
- Structure Changes: ${comparisonSummary?.structureChanges || 0}

## Detailed Changes
${comparisonResults.map((result, index) => `
${index + 1}. **${result.type.toUpperCase()}** - ${result.severity.toUpperCase()}
   - Description: ${result.description}
   - Location: Page ${result.location.page}
   - Confidence: ${Math.round(result.confidence * 100)}%
   ${result.oldValue ? `- Original: ${result.oldValue}` : ''}
   ${result.newValue ? `- Revised: ${result.newValue}` : ''}
`).join('')}

Generated on: ${new Date().toLocaleString()}
`;

      // Convert to bytes (in a real implementation, this would create a proper PDF report)
      const reportBytes = new TextEncoder().encode(reportContent);
      onReportGenerated?.(reportBytes);
      
    } catch (error) {
      console.error('Report generation failed:', error);
      alert('Failed to generate comparison report.');
    }
  }, [comparisonResults, comparisonSummary, onReportGenerated]);

  const filteredResults = comparisonResults.filter(result => {
    if (filterType !== 'all' && result.type !== filterType) return false;
    if (filterSeverity !== 'all' && result.severity !== filterSeverity) return false;
    if (!showDeleted && result.oldValue && !result.newValue) return false;
    if (!showAdded && result.newValue && !result.oldValue) return false;
    if (!showModified && result.oldValue && result.newValue) return false;
    return true;
  });

  const renderFileUpload = (type: 'original' | 'revised') => {
    const file = type === 'original' ? originalDocument : revisedDocument;
    const ref = type === 'original' ? originalFileRef : revisedFileRef;
    
    return (
      <div className={`file-upload-area ${file ? 'has-file' : ''}`}>
        <input
          ref={ref}
          type="file"
          accept=".pdf"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
              handleFileSelection(selectedFile, type);
            }
          }}
          style={{ display: 'none' }}
        />
        
        <div className="upload-content">
          {file ? (
            <>
              <FileText size={24} className="file-icon" />
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{Math.round(file.size / 1024)} KB</div>
              </div>
              <button
                className="change-file-btn"
                onClick={() => ref.current?.click()}
              >
                Change
              </button>
            </>
          ) : (
            <>
              <Upload size={32} className="upload-icon" />
              <h3>{type === 'original' ? 'Original Document' : 'Revised Document'}</h3>
              <p>Click to select or drag and drop a PDF file</p>
              <button
                className="select-file-btn"
                onClick={() => ref.current?.click()}
              >
                Select PDF File
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderComparisonSummary = () => {
    if (!comparisonSummary) return null;

    return (
      <div className="comparison-summary">
        <h3>Comparison Summary</h3>
        <div className="summary-stats">
          <div className="stat-item total">
            <span className="stat-number">{comparisonSummary.totalChanges}</span>
            <span className="stat-label">Total Changes</span>
          </div>
          <div className="stat-item added">
            <span className="stat-number">{comparisonSummary.addedContent}</span>
            <span className="stat-label">Added</span>
          </div>
          <div className="stat-item modified">
            <span className="stat-number">{comparisonSummary.modifiedContent}</span>
            <span className="stat-label">Modified</span>
          </div>
          <div className="stat-item deleted">
            <span className="stat-number">{comparisonSummary.deletedContent}</span>
            <span className="stat-label">Deleted</span>
          </div>
        </div>
        
        <div className="change-breakdown">
          <div className="breakdown-item">
            <FileText size={16} />
            <span>Text Changes: {comparisonSummary.textChanges}</span>
          </div>
          <div className="breakdown-item">
            <FileIcon size={16} />
            <span>Images: {comparisonSummary.imageChanges}</span>
          </div>
          <div className="breakdown-item">
            <Edit size={16} />
            <span>Formatting: {comparisonSummary.formattingChanges}</span>
          </div>
          <div className="breakdown-item">
            <Layers size={16} />
            <span>Structure: {comparisonSummary.structureChanges}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderResultsList = () => (
    <div className="results-list">
      <div className="results-header">
        <h3>Changes ({filteredResults.length})</h3>
        <div className="results-filters">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="formatting">Formatting</option>
            <option value="structure">Structure</option>
          </select>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="filter-select"
          >
            <option value="all">All Severity</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>
      
      <div className="change-type-filters">
        <label>
          <input
            type="checkbox"
            checked={showAdded}
            onChange={(e) => setShowAdded(e.target.checked)}
          />
          <Plus size={14} /> Added
        </label>
        <label>
          <input
            type="checkbox"
            checked={showModified}
            onChange={(e) => setShowModified(e.target.checked)}
          />
          <Edit size={14} /> Modified
        </label>
        <label>
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />
          <Minus size={14} /> Deleted
        </label>
      </div>
      
      <div className="results-items">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            className={`result-item ${result.type} ${result.severity} ${selectedResult?.id === result.id ? 'selected' : ''}`}
            onClick={() => setSelectedResult(result)}
          >
            <div className="result-header">
              <div className="result-icon">
                {result.type === 'text' && <FileText size={16} />}
                {result.type === 'image' && <FileIcon size={16} />}
                {result.type === 'formatting' && <Edit size={16} />}
                {result.type === 'structure' && <Layers size={16} />}
              </div>
              <div className="result-info">
                <div className="result-title">{result.description}</div>
                <div className="result-meta">
                  Page {result.location.page} • {result.type} • {result.severity}
                  <span className="confidence">
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
              <div className={`severity-indicator ${result.severity}`}>
                {result.severity === 'major' && <AlertCircle size={14} />}
                {result.severity === 'minor' && <AlertCircle size={14} />}
                {result.severity === 'info' && <AlertCircle size={14} />}
              </div>
            </div>
            
            {(result.oldValue || result.newValue) && (
              <div className="result-content">
                {result.oldValue && (
                  <div className="old-value">
                    <span className="value-label">Original:</span>
                    <span className="value-text">{result.oldValue}</span>
                  </div>
                )}
                {result.newValue && (
                  <div className="new-value">
                    <span className="value-label">Revised:</span>
                    <span className="value-text">{result.newValue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        
        {filteredResults.length === 0 && (
          <div className="no-results">
            <AlertCircle size={24} />
            <p>No changes found matching the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderComparisonSettings = () => (
    <div className={`comparison-settings ${showSettings ? 'visible' : ''}`}>
      <div className="settings-header">
        <h3>Comparison Settings</h3>
        <button onClick={() => setShowSettings(false)}>
          <X size={16} />
        </button>
      </div>
      
      <div className="settings-content">
        <div className="settings-group">
          <h4>Detection Options</h4>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.ignoreWhitespace}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                ignoreWhitespace: e.target.checked
              })}
            />
            Ignore whitespace changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.ignoreFormatting}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                ignoreFormatting: e.target.checked
              })}
            />
            Ignore formatting changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.ignoreCaseChanges}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                ignoreCaseChanges: e.target.checked
              })}
            />
            Ignore case changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.detectMovedText}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                detectMovedText: e.target.checked
              })}
            />
            Detect moved text
          </label>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.highlightImages}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                highlightImages: e.target.checked
              })}
            />
            Highlight image changes
          </label>
          <label>
            <input
              type="checkbox"
              checked={comparisonSettings.compareMetadata}
              onChange={(e) => setComparisonSettings({
                ...comparisonSettings,
                compareMetadata: e.target.checked
              })}
            />
            Compare metadata
          </label>
        </div>
        
        <div className="settings-group">
          <h4>Sensitivity Level</h4>
          <select
            value={comparisonSettings.sensitivityLevel}
            onChange={(e) => setComparisonSettings({
              ...comparisonSettings,
              sensitivityLevel: e.target.value as any
            })}
          >
            <option value="low">Low - Major changes only</option>
            <option value="medium">Medium - Balanced detection</option>
            <option value="high">High - Detect all changes</option>
          </select>
        </div>
        
        <div className="settings-group">
          <h4>View Options</h4>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
          >
            <option value="side-by-side">Side by side</option>
            <option value="overlay">Overlay view</option>
            <option value="changes-only">Changes only</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="document-comparison-overlay">
      <div className="document-comparison">
        <div className="comparison-header">
          <h2>Document Comparison</h2>
          <div className="header-actions">
            <button
              className="header-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Comparison Settings"
            >
              <Settings size={16} />
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="comparison-body">
          {!comparisonResults.length ? (
            <div className="file-selection-stage">
              <div className="file-uploads">
                {renderFileUpload('original')}
                <div className="comparison-arrow">
                  <ArrowRight size={24} />
                  <span>VS</span>
                </div>
                {renderFileUpload('revised')}
              </div>
              
              <div className="comparison-actions">
                <button
                  className="compare-btn primary"
                  onClick={performComparison}
                  disabled={!originalDocument || !revisedDocument || isComparing}
                >
                  {isComparing ? (
                    <>
                      <RotateCcw size={16} className="spinning" />
                      Comparing Documents...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Compare Documents
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="comparison-results">
              <div className="results-sidebar">
                {renderComparisonSummary()}
                {renderResultsList()}
              </div>
              
              <div className="comparison-viewer" ref={comparisonViewRef}>
                <div className="viewer-toolbar">
                  <div className="view-controls">
                    <button
                      className={`view-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                      onClick={() => setViewMode('side-by-side')}
                      title="Side by side view"
                    >
                      <Layers size={16} />
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'overlay' ? 'active' : ''}`}
                      onClick={() => setViewMode('overlay')}
                      title="Overlay view"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={`view-btn ${viewMode === 'changes-only' ? 'active' : ''}`}
                      onClick={() => setViewMode('changes-only')}
                      title="Changes only"
                    >
                      <Filter size={16} />
                    </button>
                  </div>
                  
                  <div className="zoom-controls">
                    <button><ZoomOut size={16} /></button>
                    <span>100%</span>
                    <button><ZoomIn size={16} /></button>
                  </div>
                </div>
                
                <div className={`document-viewer ${viewMode}`}>
                  {selectedResult ? (
                    <div className="selected-change-view">
                      <div className="change-details">
                        <h4>{selectedResult.description}</h4>
                        <div className="change-location">
                          Page {selectedResult.location.page} • 
                          Position: ({selectedResult.location.x}, {selectedResult.location.y})
                        </div>
                        <div className="change-comparison">
                          {selectedResult.oldValue && (
                            <div className="original-content">
                              <h5>Original:</h5>
                              <div className="content-box deleted">
                                {selectedResult.oldValue}
                              </div>
                            </div>
                          )}
                          {selectedResult.newValue && (
                            <div className="revised-content">
                              <h5>Revised:</h5>
                              <div className="content-box added">
                                {selectedResult.newValue}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="no-selection">
                      <Search size={48} />
                      <h3>Select a change to view details</h3>
                      <p>Click on any change in the results list to see a detailed comparison.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="comparison-footer">
          <div className="footer-info">
            {comparisonResults.length > 0 && (
              <>
                Showing {filteredResults.length} of {comparisonResults.length} changes
                {selectedResult && (
                  <> • Viewing: {selectedResult.description}</>
                )}
              </>
            )}
          </div>
          
          <div className="footer-actions">
            {comparisonResults.length > 0 && (
              <>
                <button
                  className="footer-btn"
                  onClick={() => {
                    setComparisonResults([]);
                    setComparisonSummary(null);
                    setSelectedResult(null);
                  }}
                >
                  <RotateCcw size={16} />
                  New Comparison
                </button>
                <button
                  className="footer-btn"
                  onClick={generateComparisonReport}
                >
                  <Download size={16} />
                  Export Report
                </button>
                <button
                  className="footer-btn"
                  onClick={() => {
                    // Share comparison results
                    if (navigator.share) {
                      navigator.share({
                        title: 'Document Comparison Results',
                        text: `Found ${comparisonResults.length} changes between documents.`
                      });
                    }
                  }}
                >
                  <Share2 size={16} />
                  Share
                </button>
              </>
            )}
          </div>
        </div>

        {renderComparisonSettings()}
      </div>
    </div>
  );
};

export default DocumentComparison;