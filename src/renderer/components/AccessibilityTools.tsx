import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Type,
  MousePointer,
  Navigation,
  Check,
  X,
  AlertTriangle,
  Info,
  Settings,
  Download,
  Upload,
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Zap,
  BookOpen,
  Users,
  Shield,
  Award,
  FileText,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  RotateCcw,
  Save
} from 'lucide-react';
import './AccessibilityTools.css';

interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'structure' | 'color-contrast' | 'alt-text' | 'reading-order' | 'navigation' | 'forms' | 'multimedia';
  description: string;
  location: {
    page: number;
    element?: string;
    coordinates?: { x: number; y: number; width: number; height: number };
  };
  wcagCriterion: string;
  recommendation: string;
  autoFixAvailable: boolean;
}

interface AccessibilityReport {
  compliance: 'WCAG-2.1-A' | 'WCAG-2.1-AA' | 'WCAG-2.1-AAA' | 'PDF-UA' | 'Section-508';
  score: number;
  issues: AccessibilityIssue[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  generatedAt: Date;
}

interface AccessibilityToolsProps {
  pdfBytes: Uint8Array | null;
  isVisible: boolean;
  onClose: () => void;
  onDocumentUpdated: (pdfBytes: Uint8Array) => void;
}

const AccessibilityTools: React.FC<AccessibilityToolsProps> = ({
  pdfBytes,
  isVisible,
  onClose,
  onDocumentUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'checker' | 'fixer' | 'preview' | 'settings'>('checker');
  const [accessibilityReport, setAccessibilityReport] = useState<AccessibilityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null);
  const [complianceLevel, setComplianceLevel] = useState<AccessibilityReport['compliance']>('WCAG-2.1-AA');
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState<'screen-reader' | 'high-contrast' | 'magnified' | 'keyboard-only'>('screen-reader');
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [filterCategory, setFilterCategory] = useState<'all' | AccessibilityIssue['category']>('all');
  const [filterSeverity, setFilterSeverity] = useState<'all' | AccessibilityIssue['severity']>('all');
  const [fixingInProgress, setFixingInProgress] = useState(false);
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isVisible && pdfBytes && !accessibilityReport) {
      performAccessibilityCheck();
    }
  }, [isVisible, pdfBytes]);

  const performAccessibilityCheck = useCallback(async () => {
    if (!pdfBytes) return;

    setIsScanning(true);

    try {
      // Simulate Adobe-level accessibility analysis
      await new Promise(resolve => setTimeout(resolve, 2500));

      const mockIssues: AccessibilityIssue[] = [
        {
          id: '1',
          type: 'error',
          severity: 'critical',
          category: 'structure',
          description: 'Document structure is not properly tagged',
          location: { page: 1 },
          wcagCriterion: 'SC 1.3.1 (Info and Relationships)',
          recommendation: 'Add proper structural tags to organize content hierarchically',
          autoFixAvailable: true
        },
        {
          id: '2',
          type: 'error',
          severity: 'high',
          category: 'alt-text',
          description: 'Image missing alternative text',
          location: { 
            page: 2, 
            element: 'Image #1',
            coordinates: { x: 100, y: 200, width: 150, height: 100 }
          },
          wcagCriterion: 'SC 1.1.1 (Non-text Content)',
          recommendation: 'Add descriptive alternative text for the image',
          autoFixAvailable: false
        },
        {
          id: '3',
          type: 'warning',
          severity: 'medium',
          category: 'color-contrast',
          description: 'Insufficient color contrast ratio (3.2:1)',
          location: { 
            page: 1, 
            element: 'Text block',
            coordinates: { x: 50, y: 300, width: 400, height: 50 }
          },
          wcagCriterion: 'SC 1.4.3 (Contrast Minimum)',
          recommendation: 'Increase contrast ratio to at least 4.5:1 for normal text',
          autoFixAvailable: true
        },
        {
          id: '4',
          type: 'warning',
          severity: 'medium',
          category: 'reading-order',
          description: 'Reading order may be incorrect',
          location: { page: 2 },
          wcagCriterion: 'SC 1.3.2 (Meaningful Sequence)',
          recommendation: 'Verify and correct the logical reading order',
          autoFixAvailable: true
        },
        {
          id: '5',
          type: 'info',
          severity: 'low',
          category: 'navigation',
          description: 'Document lacks bookmarks for navigation',
          location: { page: 1 },
          wcagCriterion: 'Best Practice',
          recommendation: 'Add bookmarks to improve document navigation',
          autoFixAvailable: true
        },
        {
          id: '6',
          type: 'error',
          severity: 'high',
          category: 'forms',
          description: 'Form field missing accessible label',
          location: { 
            page: 3, 
            element: 'Input field #1',
            coordinates: { x: 150, y: 250, width: 200, height: 30 }
          },
          wcagCriterion: 'SC 3.3.2 (Labels or Instructions)',
          recommendation: 'Add proper labels to form fields for screen reader accessibility',
          autoFixAvailable: true
        }
      ];

      const report: AccessibilityReport = {
        compliance: complianceLevel,
        score: 72, // Out of 100
        issues: mockIssues,
        summary: {
          totalIssues: mockIssues.length,
          criticalIssues: mockIssues.filter(i => i.severity === 'critical').length,
          highIssues: mockIssues.filter(i => i.severity === 'high').length,
          mediumIssues: mockIssues.filter(i => i.severity === 'medium').length,
          lowIssues: mockIssues.filter(i => i.severity === 'low').length
        },
        generatedAt: new Date()
      };

      setAccessibilityReport(report);

    } catch (error) {
      console.error('Accessibility check failed:', error);
      alert('Failed to perform accessibility check. Please try again.');
    } finally {
      setIsScanning(false);
    }
  }, [pdfBytes, complianceLevel]);

  const autoFixIssues = useCallback(async () => {
    if (!accessibilityReport || !pdfBytes) return;

    const fixableIssues = accessibilityReport.issues.filter(issue => 
      issue.autoFixAvailable && !fixedIssues.has(issue.id)
    );

    if (fixableIssues.length === 0) {
      alert('No auto-fixable issues found.');
      return;
    }

    setFixingInProgress(true);

    try {
      // Simulate fixing issues
      for (const issue of fixableIssues) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log(`Auto-fixing issue: ${issue.description}`);
        
        // Mark issue as fixed
        setFixedIssues(prev => new Set([...prev, issue.id]));
      }

      // Update report to remove fixed issues
      const updatedReport = {
        ...accessibilityReport,
        issues: accessibilityReport.issues.filter(issue => !fixedIssues.has(issue.id)),
        score: Math.min(100, accessibilityReport.score + (fixableIssues.length * 5))
      };

      updatedReport.summary = {
        totalIssues: updatedReport.issues.length,
        criticalIssues: updatedReport.issues.filter(i => i.severity === 'critical').length,
        highIssues: updatedReport.issues.filter(i => i.severity === 'high').length,
        mediumIssues: updatedReport.issues.filter(i => i.severity === 'medium').length,
        lowIssues: updatedReport.issues.filter(i => i.severity === 'low').length
      };

      setAccessibilityReport(updatedReport);

      // Simulate updated PDF bytes
      onDocumentUpdated(pdfBytes);

      alert(`Successfully fixed ${fixableIssues.length} accessibility issues!`);

    } catch (error) {
      console.error('Auto-fix failed:', error);
      alert('Failed to fix some issues. Please try manual fixes.');
    } finally {
      setFixingInProgress(false);
    }
  }, [accessibilityReport, pdfBytes, fixedIssues, onDocumentUpdated]);

  const exportAccessibilityReport = useCallback(async () => {
    if (!accessibilityReport) return;

    const reportContent = `
# Accessibility Report

## Compliance Level: ${accessibilityReport.compliance}
**Score: ${accessibilityReport.score}/100**

## Summary
- Total Issues: ${accessibilityReport.summary.totalIssues}
- Critical: ${accessibilityReport.summary.criticalIssues}
- High: ${accessibilityReport.summary.highIssues}
- Medium: ${accessibilityReport.summary.mediumIssues}
- Low: ${accessibilityReport.summary.lowIssues}

## Detailed Issues
${accessibilityReport.issues.map((issue, index) => `
${index + 1}. **${issue.type.toUpperCase()}** - ${issue.severity.toUpperCase()}
   - Category: ${issue.category}
   - Description: ${issue.description}
   - Location: Page ${issue.location.page}${issue.location.element ? ` (${issue.location.element})` : ''}
   - WCAG Criterion: ${issue.wcagCriterion}
   - Recommendation: ${issue.recommendation}
   - Auto-fix Available: ${issue.autoFixAvailable ? 'Yes' : 'No'}
`).join('')}

Generated on: ${accessibilityReport.generatedAt.toLocaleString()}
`;

    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accessibility-report.md';
    a.click();
    URL.revokeObjectURL(url);
  }, [accessibilityReport]);

  const startScreenReaderPreview = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setIsPlaying(true);
      // Simulate screen reader announcement
      const announcement = "Beginning document reading. Page 1. Heading level 1: Professional PDF Editor. This document contains text content with proper structure and navigation elements.";
      
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(announcement);
        utterance.rate = readingSpeed;
        utterance.volume = volume;
        utterance.onend = () => setIsPlaying(false);
        speechSynthesis.speak(utterance);
      }
    }
  }, [isPlaying, readingSpeed, volume]);

  const filteredIssues = accessibilityReport?.issues.filter(issue => {
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    return !fixedIssues.has(issue.id);
  }) || [];

  const renderAccessibilityChecker = () => (
    <div className="accessibility-checker">
      <div className="checker-header">
        <div className="compliance-selector">
          <label>Compliance Level:</label>
          <select
            value={complianceLevel}
            onChange={(e) => setComplianceLevel(e.target.value as AccessibilityReport['compliance'])}
          >
            <option value="WCAG-2.1-A">WCAG 2.1 Level A</option>
            <option value="WCAG-2.1-AA">WCAG 2.1 Level AA</option>
            <option value="WCAG-2.1-AAA">WCAG 2.1 Level AAA</option>
            <option value="PDF-UA">PDF/UA Universal Access</option>
            <option value="Section-508">Section 508</option>
          </select>
        </div>
        
        <div className="checker-actions">
          <button
            className="scan-btn primary"
            onClick={performAccessibilityCheck}
            disabled={isScanning || !pdfBytes}
          >
            {isScanning ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Scanning...
              </>
            ) : (
              <>
                <Search size={16} />
                Check Accessibility
              </>
            )}
          </button>
        </div>
      </div>

      {accessibilityReport && (
        <>
          <div className="accessibility-score">
            <div className="score-circle">
              <div className="score-value">{accessibilityReport.score}</div>
              <div className="score-label">Score</div>
            </div>
            <div className="score-details">
              <h3>Accessibility Analysis</h3>
              <p>Compliance: <strong>{accessibilityReport.compliance}</strong></p>
              <div className="issue-summary">
                <div className="issue-count critical">
                  <AlertTriangle size={16} />
                  <span>{accessibilityReport.summary.criticalIssues} Critical</span>
                </div>
                <div className="issue-count high">
                  <X size={16} />
                  <span>{accessibilityReport.summary.highIssues} High</span>
                </div>
                <div className="issue-count medium">
                  <AlertTriangle size={16} />
                  <span>{accessibilityReport.summary.mediumIssues} Medium</span>
                </div>
                <div className="issue-count low">
                  <Info size={16} />
                  <span>{accessibilityReport.summary.lowIssues} Low</span>
                </div>
              </div>
            </div>
          </div>

          <div className="issues-section">
            <div className="issues-header">
              <h3>Issues Found ({filteredIssues.length})</h3>
              <div className="issue-filters">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as any)}
                >
                  <option value="all">All Categories</option>
                  <option value="structure">Structure</option>
                  <option value="color-contrast">Color Contrast</option>
                  <option value="alt-text">Alternative Text</option>
                  <option value="reading-order">Reading Order</option>
                  <option value="navigation">Navigation</option>
                  <option value="forms">Forms</option>
                  <option value="multimedia">Multimedia</option>
                </select>
                
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value as any)}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="issues-list">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className={`issue-item ${issue.type} ${issue.severity} ${selectedIssue?.id === issue.id ? 'selected' : ''}`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="issue-icon">
                    {issue.type === 'error' && <X size={16} />}
                    {issue.type === 'warning' && <AlertTriangle size={16} />}
                    {issue.type === 'info' && <Info size={16} />}
                  </div>
                  
                  <div className="issue-content">
                    <div className="issue-header">
                      <span className="issue-description">{issue.description}</span>
                      <span className={`severity-badge ${issue.severity}`}>
                        {issue.severity}
                      </span>
                    </div>
                    
                    <div className="issue-details">
                      <span className="issue-location">
                        Page {issue.location.page}
                        {issue.location.element && ` • ${issue.location.element}`}
                      </span>
                      <span className="issue-category">{issue.category}</span>
                      {issue.autoFixAvailable && (
                        <span className="auto-fix-indicator">
                          <Zap size={12} /> Auto-fix available
                        </span>
                      )}
                    </div>
                    
                    <div className="wcag-criterion">
                      <strong>WCAG:</strong> {issue.wcagCriterion}
                    </div>
                    
                    <div className="issue-recommendation">
                      <strong>Recommendation:</strong> {issue.recommendation}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredIssues.length === 0 && (
                <div className="no-issues">
                  <Check size={48} />
                  <h3>No accessibility issues found!</h3>
                  <p>The document meets the selected compliance standards.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderAccessibilityFixer = () => (
    <div className="accessibility-fixer">
      <div className="fixer-header">
        <h3>Accessibility Fixes</h3>
        <div className="fix-actions">
          <label className="auto-fix-toggle">
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={(e) => setAutoFixEnabled(e.target.checked)}
            />
            Enable auto-fixes
          </label>
          
          <button
            className="auto-fix-btn primary"
            onClick={autoFixIssues}
            disabled={fixingInProgress || !accessibilityReport || !autoFixEnabled}
          >
            {fixingInProgress ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Fixing Issues...
              </>
            ) : (
              <>
                <Zap size={16} />
                Auto-Fix Issues
              </>
            )}
          </button>
        </div>
      </div>

      {accessibilityReport && (
        <div className="fix-progress">
          <div className="progress-stats">
            <div className="stat-item">
              <span className="stat-value">{fixedIssues.size}</span>
              <span className="stat-label">Fixed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {accessibilityReport.issues.filter(i => i.autoFixAvailable && !fixedIssues.has(i.id)).length}
              </span>
              <span className="stat-label">Auto-fixable</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {accessibilityReport.issues.filter(i => !i.autoFixAvailable && !fixedIssues.has(i.id)).length}
              </span>
              <span className="stat-label">Manual</span>
            </div>
          </div>
        </div>
      )}

      <div className="manual-fixes">
        <h4>Manual Fixes Required</h4>
        <div className="manual-fix-list">
          {accessibilityReport?.issues
            .filter(issue => !issue.autoFixAvailable && !fixedIssues.has(issue.id))
            .map((issue) => (
              <div key={issue.id} className="manual-fix-item">
                <div className="fix-description">
                  <strong>{issue.description}</strong>
                  <p>{issue.recommendation}</p>
                </div>
                <button className="mark-fixed-btn">
                  Mark as Fixed
                </button>
              </div>
            ))}
          
          {(!accessibilityReport?.issues.some(i => !i.autoFixAvailable && !fixedIssues.has(i.id))) && (
            <div className="no-manual-fixes">
              <Check size={24} />
              <p>No manual fixes required!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAccessibilityPreview = () => (
    <div className="accessibility-preview">
      <div className="preview-controls">
        <h3>Accessibility Preview</h3>
        
        <div className="preview-modes">
          <button
            className={`mode-btn ${previewMode === 'screen-reader' ? 'active' : ''}`}
            onClick={() => setPreviewMode('screen-reader')}
          >
            <Volume2 size={16} />
            Screen Reader
          </button>
          <button
            className={`mode-btn ${previewMode === 'high-contrast' ? 'active' : ''}`}
            onClick={() => setPreviewMode('high-contrast')}
          >
            <Eye size={16} />
            High Contrast
          </button>
          <button
            className={`mode-btn ${previewMode === 'magnified' ? 'active' : ''}`}
            onClick={() => setPreviewMode('magnified')}
          >
            <Search size={16} />
            Magnified
          </button>
          <button
            className={`mode-btn ${previewMode === 'keyboard-only' ? 'active' : ''}`}
            onClick={() => setPreviewMode('keyboard-only')}
          >
            <MousePointer size={16} />
            Keyboard Only
          </button>
        </div>
      </div>

      {previewMode === 'screen-reader' && (
        <div className="screen-reader-preview">
          <div className="reader-controls">
            <button
              className="play-btn"
              onClick={startScreenReaderPreview}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? 'Pause' : 'Start'} Reading
            </button>
            
            <div className="reader-settings">
              <div className="setting-group">
                <label>Speed:</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={readingSpeed}
                  onChange={(e) => setReadingSpeed(parseFloat(e.target.value))}
                />
                <span>{readingSpeed}x</span>
              </div>
              
              <div className="setting-group">
                <label>Volume:</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
                <span>{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </div>
          
          <div className="reading-simulation">
            <h4>Screen Reader Output:</h4>
            <div className="reader-output">
              {isPlaying ? (
                <p className="reading-text">
                  "Beginning document reading. Page 1. Heading level 1: Professional PDF Editor. 
                  This document contains text content with proper structure and navigation elements."
                </p>
              ) : (
                <p className="placeholder">Click "Start Reading" to simulate screen reader output</p>
              )}
            </div>
          </div>
        </div>
      )}

      {previewMode === 'high-contrast' && (
        <div className="high-contrast-preview">
          <div className="contrast-info">
            <h4>High Contrast Mode</h4>
            <p>This view simulates how the document appears with high contrast settings.</p>
          </div>
          <div ref={previewRef} className="contrast-document-preview">
            {/* Document preview with high contrast applied */}
            <div className="preview-placeholder high-contrast">
              <h2>Document Title</h2>
              <p>This is how text appears in high contrast mode with inverted colors and enhanced visibility.</p>
              <button>Sample Button</button>
            </div>
          </div>
        </div>
      )}

      {previewMode === 'magnified' && (
        <div className="magnified-preview">
          <div className="magnification-info">
            <h4>Magnification Preview (200%)</h4>
            <p>This view shows how the document appears when magnified for users with visual impairments.</p>
          </div>
          <div className="magnified-document-preview">
            <div className="preview-placeholder magnified">
              <h2>Document Title</h2>
              <p>Text and elements are enlarged to improve readability for users with low vision.</p>
            </div>
          </div>
        </div>
      )}

      {previewMode === 'keyboard-only' && (
        <div className="keyboard-preview">
          <div className="keyboard-info">
            <h4>Keyboard Navigation</h4>
            <p>This view shows the tab order and keyboard accessibility of document elements.</p>
          </div>
          <div className="keyboard-simulation">
            <div className="tab-order-visualization">
              <div className="tab-item active">1. Document title</div>
              <div className="tab-item">2. Main content</div>
              <div className="tab-item">3. Form field 1</div>
              <div className="tab-item">4. Form field 2</div>
              <div className="tab-item">5. Submit button</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="accessibility-settings">
      <h3>Accessibility Settings</h3>
      
      <div className="settings-section">
        <h4>Compliance Standards</h4>
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            WCAG 2.1 Guidelines
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            PDF/UA Compliance
          </label>
          <label>
            <input
              type="checkbox"
            />
            Section 508 Standards
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h4>Auto-Fix Options</h4>
        <div className="setting-group">
          <label>
            <input
              type="checkbox"
              checked={autoFixEnabled}
              onChange={(e) => setAutoFixEnabled(e.target.checked)}
            />
            Enable automatic fixes
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            Fix color contrast issues
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            Add missing structure tags
          </label>
          <label>
            <input
              type="checkbox"
              defaultChecked
            />
            Correct reading order
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h4>Export Options</h4>
        <div className="setting-group">
          <button className="export-btn">
            <Download size={16} />
            Export Accessible PDF
          </button>
          <button className="export-btn">
            <FileText size={16} />
            Generate Report
          </button>
          <button className="export-btn">
            <Award size={16} />
            Compliance Certificate
          </button>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="accessibility-tools-overlay">
      <div className="accessibility-tools">
        <div className="tools-header">
          <h2>Accessibility Tools</h2>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="tools-nav">
          <button
            className={`nav-btn ${activeTab === 'checker' ? 'active' : ''}`}
            onClick={() => setActiveTab('checker')}
          >
            <Search size={16} />
            Checker
          </button>
          <button
            className={`nav-btn ${activeTab === 'fixer' ? 'active' : ''}`}
            onClick={() => setActiveTab('fixer')}
          >
            <Zap size={16} />
            Fixer
          </button>
          <button
            className={`nav-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            Settings
          </button>
        </div>

        <div className="tools-content">
          {activeTab === 'checker' && renderAccessibilityChecker()}
          {activeTab === 'fixer' && renderAccessibilityFixer()}
          {activeTab === 'preview' && renderAccessibilityPreview()}
          {activeTab === 'settings' && renderSettings()}
        </div>

        <div className="tools-footer">
          <div className="footer-info">
            {accessibilityReport && (
              <>
                Score: {accessibilityReport.score}/100 | 
                Issues: {accessibilityReport.summary.totalIssues} | 
                Fixed: {fixedIssues.size}
              </>
            )}
          </div>
          
          <div className="footer-actions">
            <button
              className="footer-btn"
              onClick={exportAccessibilityReport}
              disabled={!accessibilityReport}
            >
              <Download size={16} />
              Export Report
            </button>
            
            <button
              className="footer-btn primary"
              onClick={autoFixIssues}
              disabled={!accessibilityReport || fixingInProgress}
            >
              <Zap size={16} />
              Quick Fix All
            </button>
          </div>
        </div>

        <audio ref={audioRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default AccessibilityTools;