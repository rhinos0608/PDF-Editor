import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import AdvancedPDFAnalyticsService, { 
  DocumentMetrics, 
  DocumentIntelligence, 
  OptimizationSuggestions 
} from '../services/AdvancedPDFAnalyticsService';
import './AnalyticsDashboard.css';

interface AnalyticsDashboardProps {
  pdf?: PDFDocumentProxy;
  pdfBytes?: Uint8Array;
  isVisible: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  metrics: DocumentMetrics;
  intelligence: DocumentIntelligence;
  suggestions: OptimizationSuggestions;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  pdf,
  pdfBytes,
  isVisible,
  onClose
}) => {
  const [analyticsService] = useState(() => new AdvancedPDFAnalyticsService());
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'intelligence' | 'suggestions' | 'performance'>('overview');
  const [chartData, setChartData] = useState<any>(null);

  // Analyze document when component mounts or PDF changes
  useEffect(() => {
    if (isVisible && pdf && pdfBytes) {
      analyzeDocument();
    }
  }, [isVisible, pdf, pdfBytes]);

  const analyzeDocument = useCallback(async () => {
    if (!pdf || !pdfBytes) return;

    setIsAnalyzing(true);
    try {
      const result = await analyticsService.analyzeDocument(pdf, pdfBytes);
      setAnalysis(result);
      generateChartData(result.metrics);
      toast.success('Document analysis completed');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze document');
    } finally {
      setIsAnalyzing(false);
    }
  }, [pdf, pdfBytes, analyticsService]);

  const generateChartData = (metrics: DocumentMetrics) => {
    setChartData({
      pageDistribution: {
        portrait: metrics.pageDimensions.filter(p => p.orientation === 'portrait').length,
        landscape: metrics.pageDimensions.filter(p => p.orientation === 'landscape').length
      },
      contentAnalysis: {
        textDensity: metrics.contentAnalysis.textDensity,
        imageDensity: metrics.contentAnalysis.imageDensity,
        averageWords: metrics.contentAnalysis.averageWordsPerPage
      },
      qualityMetrics: {
        textClarity: metrics.qualityMetrics.textClarity,
        imageQuality: metrics.qualityMetrics.imageQuality,
        accessibility: metrics.qualityMetrics.accessibilityScore
      }
    });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getQualityColor = (score: number): string => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 60) return '#FFC107'; // Yellow
    if (score >= 40) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getSuggestionIcon = (impact: 'high' | 'medium' | 'low'): string => {
    switch (impact) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const renderOverviewTab = () => {
    if (!analysis) return null;

    const { metrics } = analysis;

    return (
      <div className="analytics-overview">
        <div className="metrics-grid">
          {/* File Information */}
          <div className="metric-card">
            <h3>📄 Document Info</h3>
            <div className="metric-items">
              <div className="metric-item">
                <span className="label">File Size:</span>
                <span className="value">{formatBytes(metrics.fileSize)}</span>
              </div>
              <div className="metric-item">
                <span className="label">Pages:</span>
                <span className="value">{metrics.pageCount}</span>
              </div>
              <div className="metric-item">
                <span className="label">Fonts:</span>
                <span className="value">{metrics.fontCount}</span>
              </div>
              <div className="metric-item">
                <span className="label">Images:</span>
                <span className="value">{metrics.imageCount}</span>
              </div>
            </div>
          </div>

          {/* Content Analysis */}
          <div className="metric-card">
            <h3>📊 Content Analysis</h3>
            <div className="metric-items">
              <div className="metric-item">
                <span className="label">Text Density:</span>
                <span className="value">{Math.round(metrics.contentAnalysis.textDensity)} chars/page</span>
              </div>
              <div className="metric-item">
                <span className="label">Image Density:</span>
                <span className="value">{metrics.contentAnalysis.imageDensity.toFixed(1)} images/page</span>
              </div>
              <div className="metric-item">
                <span className="label">Avg Words:</span>
                <span className="value">{Math.round(metrics.contentAnalysis.averageWordsPerPage)} words/page</span>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="metric-card">
            <h3>⭐ Quality Metrics</h3>
            <div className="quality-indicators">
              <div className="quality-item">
                <span className="label">Text Clarity:</span>
                <div className="quality-bar">
                  <div 
                    className="quality-fill"
                    style={{ 
                      width: `${metrics.qualityMetrics.textClarity}%`,
                      backgroundColor: getQualityColor(metrics.qualityMetrics.textClarity)
                    }}
                  ></div>
                  <span className="quality-value">{formatPercentage(metrics.qualityMetrics.textClarity)}</span>
                </div>
              </div>
              <div className="quality-item">
                <span className="label">Image Quality:</span>
                <div className="quality-bar">
                  <div 
                    className="quality-fill"
                    style={{ 
                      width: `${metrics.qualityMetrics.imageQuality}%`,
                      backgroundColor: getQualityColor(metrics.qualityMetrics.imageQuality)
                    }}
                  ></div>
                  <span className="quality-value">{formatPercentage(metrics.qualityMetrics.imageQuality)}</span>
                </div>
              </div>
              <div className="quality-item">
                <span className="label">Accessibility:</span>
                <div className="quality-bar">
                  <div 
                    className="quality-fill"
                    style={{ 
                      width: `${metrics.qualityMetrics.accessibilityScore}%`,
                      backgroundColor: getQualityColor(metrics.qualityMetrics.accessibilityScore)
                    }}
                  ></div>
                  <span className="quality-value">{formatPercentage(metrics.qualityMetrics.accessibilityScore)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance */}
          <div className="metric-card">
            <h3>⚡ Performance</h3>
            <div className="metric-items">
              <div className="metric-item">
                <span className="label">Load Time:</span>
                <span className="value">{metrics.performance.loadTime.toFixed(2)}ms</span>
              </div>
              <div className="metric-item">
                <span className="label">Render Time:</span>
                <span className="value">{metrics.performance.renderTime.toFixed(2)}ms</span>
              </div>
              <div className="metric-item">
                <span className="label">Memory Usage:</span>
                <span className="value">{formatBytes(metrics.performance.memoryUsage)}</span>
              </div>
              {metrics.performance.compressionRatio && (
                <div className="metric-item">
                  <span className="label">Compression:</span>
                  <span className="value">{formatPercentage(metrics.performance.compressionRatio * 100)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        {chartData && (
          <div className="charts-section">
            <div className="chart-container">
              <h4>Page Orientation Distribution</h4>
              <div className="pie-chart-simple">
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color portrait"></span>
                    Portrait: {chartData.pageDistribution.portrait}
                  </div>
                  <div className="legend-item">
                    <span className="legend-color landscape"></span>
                    Landscape: {chartData.pageDistribution.landscape}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIntelligenceTab = () => {
    if (!analysis) return null;

    const { intelligence } = analysis;

    return (
      <div className="analytics-intelligence">
        <div className="intelligence-grid">
          {/* Document Classification */}
          <div className="intelligence-card">
            <h3>🔍 Document Classification</h3>
            <div className="classification-info">
              <div className="classification-item">
                <span className="label">Type:</span>
                <span className="value document-type">{intelligence.documentType}</span>
              </div>
              <div className="classification-item">
                <span className="label">Language:</span>
                <span className="value">{intelligence.language}</span>
              </div>
              <div className="classification-item">
                <span className="label">Reading Level:</span>
                <span className="value">{intelligence.readingLevel.toFixed(1)}/100</span>
              </div>
              <div className="classification-item">
                <span className="label">Confidence:</span>
                <span className="value">{formatPercentage(intelligence.confidenceLevel)}</span>
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="intelligence-card">
            <h3>🏷️ Keywords</h3>
            <div className="keywords-container">
              {intelligence.keywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>

          {/* Topics */}
          <div className="intelligence-card">
            <h3>📚 Topics</h3>
            <div className="topics-container">
              {intelligence.topics.length > 0 ? (
                intelligence.topics.map((topic, index) => (
                  <span key={index} className="topic-tag">{topic}</span>
                ))
              ) : (
                <span className="no-topics">No specific topics detected</span>
              )}
            </div>
          </div>

          {/* Content Structure */}
          <div className="intelligence-card">
            <h3>🏗️ Content Structure</h3>
            <div className="structure-info">
              <div className="structure-item">
                <span className="label">Table of Contents:</span>
                <span className={`value ${intelligence.contentStructure.hasTableOfContents ? 'present' : 'missing'}`}>
                  {intelligence.contentStructure.hasTableOfContents ? '✅ Present' : '❌ Missing'}
                </span>
              </div>
              <div className="structure-item">
                <span className="label">Headers:</span>
                <span className={`value ${intelligence.contentStructure.hasHeaders ? 'present' : 'missing'}`}>
                  {intelligence.contentStructure.hasHeaders ? '✅ Present' : '❌ Missing'}
                </span>
              </div>
              <div className="structure-item">
                <span className="label">Page Numbers:</span>
                <span className={`value ${intelligence.contentStructure.hasPageNumbers ? 'present' : 'missing'}`}>
                  {intelligence.contentStructure.hasPageNumbers ? '✅ Present' : '❌ Missing'}
                </span>
              </div>
              <div className="structure-item">
                <span className="label">Sections:</span>
                <span className="value">{intelligence.contentStructure.sectionCount}</span>
              </div>
            </div>
          </div>

          {/* Sentiment Analysis */}
          {intelligence.sentimentScore !== undefined && (
            <div className="intelligence-card">
              <h3>😊 Sentiment Analysis</h3>
              <div className="sentiment-indicator">
                <div className="sentiment-bar">
                  <div 
                    className="sentiment-fill"
                    style={{ 
                      width: `${Math.abs(intelligence.sentimentScore) * 100}%`,
                      backgroundColor: intelligence.sentimentScore > 0 ? '#4CAF50' : intelligence.sentimentScore < 0 ? '#F44336' : '#9E9E9E'
                    }}
                  ></div>
                  <span className="sentiment-label">
                    {intelligence.sentimentScore > 0.1 ? 'Positive' :
                     intelligence.sentimentScore < -0.1 ? 'Negative' : 'Neutral'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuggestionsTab = () => {
    if (!analysis) return null;

    const { suggestions } = analysis;

    return (
      <div className="analytics-suggestions">
        {/* File Size Optimization */}
        <div className="suggestions-section">
          <h3>💾 File Size Optimization</h3>
          <div className="current-stats">
            <span>Current Size: {formatBytes(suggestions.fileSize.currentSize)}</span>
            <span>Potential Savings: {formatBytes(suggestions.fileSize.potentialSavings)}</span>
          </div>
          <div className="suggestions-list">
            {suggestions.fileSize.suggestions.map((suggestion, index) => (
              <div key={index} className={`suggestion-item ${suggestion.impact}`}>
                <span className="suggestion-icon">{getSuggestionIcon(suggestion.impact)}</span>
                <div className="suggestion-content">
                  <div className="suggestion-action">{suggestion.action}</div>
                  <div className="suggestion-description">{suggestion.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accessibility Improvements */}
        <div className="suggestions-section">
          <h3>♿ Accessibility Improvements</h3>
          <div className="current-stats">
            <span>Current Score: {formatPercentage(suggestions.accessibility.currentScore)}</span>
          </div>
          
          {suggestions.accessibility.issues.length > 0 && (
            <div className="issues-list">
              <h4>Issues Found:</h4>
              {suggestions.accessibility.issues.map((issue, index) => (
                <div key={index} className={`issue-item ${issue.severity}`}>
                  <span className="issue-severity">{issue.severity}</span>
                  <div className="issue-content">
                    <div className="issue-type">{issue.type}</div>
                    <div className="issue-description">{issue.description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="improvements-list">
            <h4>Recommended Improvements:</h4>
            {suggestions.accessibility.improvements.map((improvement, index) => (
              <div key={index} className="improvement-item">
                <div className="improvement-action">{improvement.action}</div>
                <div className="improvement-impact">Impact: {improvement.impact}</div>
                <div className="improvement-description">{improvement.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Optimization */}
        <div className="suggestions-section">
          <h3>⚡ Performance Optimization</h3>
          <div className="performance-suggestions">
            <h4>Rendering Optimizations:</h4>
            {suggestions.performance.renderingOptimizations.map((opt, index) => (
              <div key={index} className="performance-item">
                <div className="performance-action">{opt.action}</div>
                <div className="performance-benefit">{opt.benefit}</div>
              </div>
            ))}
            
            <h4>Memory Optimizations:</h4>
            {suggestions.performance.memoryOptimizations.map((opt, index) => (
              <div key={index} className="performance-item">
                <div className="performance-action">{opt.action}</div>
                <div className="performance-benefit">{opt.benefit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Improvements */}
        <div className="suggestions-section">
          <h3>✨ Quality Improvements</h3>
          <div className="quality-suggestions">
            {suggestions.quality.imageOptimizations.length > 0 && (
              <>
                <h4>Image Optimizations:</h4>
                {suggestions.quality.imageOptimizations.map((opt, index) => (
                  <div key={index} className="quality-item">
                    <div className="quality-page">Page {opt.page}</div>
                    <div className="quality-action">{opt.action}</div>
                    <div className="quality-benefit">{opt.benefit}</div>
                  </div>
                ))}
              </>
            )}
            
            {suggestions.quality.fontOptimizations.length > 0 && (
              <>
                <h4>Font Optimizations:</h4>
                {suggestions.quality.fontOptimizations.map((opt, index) => (
                  <div key={index} className="quality-item">
                    <div className="quality-action">{opt.action}</div>
                    <div className="quality-benefit">{opt.benefit}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceTab = () => {
    const performanceInsights = analyticsService.getPerformanceInsights();

    return (
      <div className="analytics-performance">
        <div className="performance-metrics">
          <h3>📈 Performance Metrics</h3>
          {Object.entries(performanceInsights).length > 0 ? (
            <div className="metrics-list">
              {Object.entries(performanceInsights).map(([operation, duration]) => (
                <div key={operation} className="performance-metric">
                  <span className="metric-name">{operation}</span>
                  <span className="metric-duration">{duration.toFixed(2)}ms</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No performance metrics available yet.</p>
          )}
        </div>

        <div className="performance-tips">
          <h3>💡 Performance Tips</h3>
          <ul>
            <li>Use virtual scrolling for documents with many pages</li>
            <li>Enable lazy loading for images and complex content</li>
            <li>Implement page-level caching for frequently accessed documents</li>
            <li>Consider using web workers for heavy processing tasks</li>
            <li>Optimize image compression to reduce file size</li>
            <li>Use efficient PDF rendering libraries with hardware acceleration</li>
          </ul>
        </div>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="analytics-dashboard-overlay">
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h2>📊 Document Analytics</h2>
          <button 
            className="close-button"
            onClick={onClose}
            title="Close Analytics"
          >
            ✕
          </button>
        </div>

        <div className="analytics-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'intelligence' ? 'active' : ''}`}
            onClick={() => setActiveTab('intelligence')}
          >
            🧠 Intelligence
          </button>
          <button 
            className={`tab-button ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            💡 Suggestions
          </button>
          <button 
            className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
            onClick={() => setActiveTab('performance')}
          >
            ⚡ Performance
          </button>
        </div>

        <div className="analytics-content">
          {isAnalyzing ? (
            <div className="analytics-loading">
              <div className="loading-spinner"></div>
              <p>Analyzing document...</p>
            </div>
          ) : analysis ? (
            <div className="analytics-tabs-content">
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'intelligence' && renderIntelligenceTab()}
              {activeTab === 'suggestions' && renderSuggestionsTab()}
              {activeTab === 'performance' && renderPerformanceTab()}
            </div>
          ) : (
            <div className="no-analysis">
              <p>No analysis available. Please open a PDF document to begin analysis.</p>
            </div>
          )}
        </div>

        {analysis && (
          <div className="analytics-footer">
            <button 
              className="refresh-button"
              onClick={analyzeDocument}
              disabled={isAnalyzing}
            >
              🔄 Refresh Analysis
            </button>
            <button 
              className="export-button"
              onClick={() => {
                // Export analysis data
                const exportData = {
                  timestamp: new Date().toISOString(),
                  analysis
                };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'document-analysis.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              📥 Export Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
