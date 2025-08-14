import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  TrendingUp, 
  Shield, 
  Users, 
  Calendar, 
  DollarSign, 
  MapPin,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  FileSearch,
  Lightbulb
} from 'lucide-react';
import { DocumentIntelligenceService, DocumentSummary, ContentAnalysis, IntelligentInsights } from '../services/DocumentIntelligenceService';
import './DocumentIntelligencePanel.css';

interface DocumentIntelligencePanelProps {
  pdf: any;
  pdfBytes: Uint8Array;
  textContent: string;
  isVisible: boolean;
  onClose: () => void;
}

const DocumentIntelligencePanel: React.FC<DocumentIntelligencePanelProps> = ({
  pdf,
  pdfBytes,
  textContent,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'analysis' | 'insights' | 'compare'>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [insights, setInsights] = useState<IntelligentInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const intelligenceService = new DocumentIntelligenceService();

  useEffect(() => {
    if (isVisible && pdf && textContent) {
      generateIntelligence();
    }
  }, [isVisible, pdf, textContent]);

  const generateIntelligence = async () => {
    if (!pdf || !textContent) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧠 Starting AI document analysis...');
      
      const [summaryResult, analysisResult, insightsResult] = await Promise.all([
        intelligenceService.generateDocumentSummary(pdf, textContent),
        intelligenceService.analyzeContent(pdf, textContent),
        intelligenceService.generateInsights(pdf, textContent, pdfBytes)
      ]);

      setSummary(summaryResult);
      setAnalysis(analysisResult);
      setInsights(insightsResult);
      
      console.log('✅ AI document analysis complete');
    } catch (err) {
      console.error('❌ Error during AI analysis:', err);
      setError('Failed to analyze document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSummaryTab = () => (
    <div className="intelligence-tab-content">
      <div className="summary-header">
        <div className="summary-overview">
          <h3><Brain size={20} /> Document Summary</h3>
          {summary && (
            <div className="summary-stats">
              <div className="stat-item">
                <Clock size={16} />
                <span>{summary.estimatedReadingTime} min read</span>
              </div>
              <div className="stat-item">
                <FileText size={16} />
                <span>{summary.documentLength} document</span>
              </div>
              <div className="stat-item">
                <BarChart3 size={16} />
                <span>{summary.complexity} complexity</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {summary && (
        <>
          <div className="summary-section">
            <h4>Executive Summary</h4>
            <p className="executive-summary">{summary.executiveSummary}</p>
          </div>

          <div className="summary-section">
            <h4>Key Points</h4>
            <ul className="key-points">
              {summary.keyPoints.map((point, index) => (
                <li key={index}>
                  <CheckCircle size={16} className="check-icon" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="summary-section">
            <h4>Main Topics</h4>
            <div className="topics-grid">
              {summary.mainTopics.map((topic, index) => (
                <div key={index} className="topic-item">
                  <div className="topic-header">
                    <span className="topic-name">{topic.topic}</span>
                    <span className="topic-relevance">{topic.relevance.toFixed(1)}%</span>
                  </div>
                  <div className="topic-pages">Pages: {topic.pageReferences.join(', ')}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="intelligence-tab-content">
      <div className="analysis-header">
        <h3><FileSearch size={20} /> Content Analysis</h3>
      </div>

      {analysis && (
        <>
          <div className="analysis-section">
            <h4>Document Classification</h4>
            <div className="classification-grid">
              <div className="classification-item">
                <strong>Type:</strong> <span className="document-type">{analysis.documentType}</span>
              </div>
              <div className="classification-item">
                <strong>Language:</strong> <span>{analysis.language}</span>
              </div>
              <div className="classification-item">
                <strong>Confidence:</strong> <span>{(analysis.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h4>Document Structure</h4>
            <div className="structure-indicators">
              <div className={`indicator ${analysis.structure.hasTitle ? 'present' : 'absent'}`}>
                <CheckCircle size={16} /> Title
              </div>
              <div className={`indicator ${analysis.structure.hasTableOfContents ? 'present' : 'absent'}`}>
                <CheckCircle size={16} /> Table of Contents
              </div>
              <div className={`indicator ${analysis.structure.hasAbstract ? 'present' : 'absent'}`}>
                <CheckCircle size={16} /> Abstract
              </div>
              <div className={`indicator ${analysis.structure.hasConclusion ? 'present' : 'absent'}`}>
                <CheckCircle size={16} /> Conclusion
              </div>
            </div>
          </div>

          {analysis.entities.people.length > 0 && (
            <div className="analysis-section">
              <h4>Named Entities</h4>
              <div className="entity-category">
                <h5><Users size={16} /> People ({analysis.entities.people.length})</h5>
                <div className="entity-list">
                  {analysis.entities.people.slice(0, 3).map((person, index) => (
                    <div key={index} className="entity-item">
                      <span className="entity-name">{person.name}</span>
                      <span className="entity-frequency">{person.frequency}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="analysis-section">
            <h4>Sentiment Analysis</h4>
            <div className="sentiment-analysis">
              <div className="sentiment-overall">
                <div className={`sentiment-indicator ${analysis.sentimentAnalysis.overall}`}>
                  {analysis.sentimentAnalysis.overall.toUpperCase()}
                </div>
                <div className="sentiment-score">
                  Score: {analysis.sentimentAnalysis.score.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderInsightsTab = () => (
    <div className="intelligence-tab-content">
      <div className="insights-header">
        <h3><Lightbulb size={20} /> Intelligent Insights</h3>
        {insights && (
          <div className="quality-score">
            <Star size={16} />
            <span>Quality Score: {insights.qualityScore}/100</span>
          </div>
        )}
      </div>

      {insights && insights.issues.length > 0 && (
        <div className="insights-section">
          <h4>Issues Detected</h4>
          <div className="issues-list">
            {insights.issues.map((issue, index) => (
              <div key={index} className={`issue-item severity-${issue.severity}`}>
                <div className="issue-header">
                  <AlertTriangle size={16} className="issue-icon" />
                  <span className="issue-type">{issue.type}</span>
                  <span className={`issue-severity severity-${issue.severity}`}>{issue.severity}</span>
                </div>
                <div className="issue-description">{issue.description}</div>
                <div className="issue-suggestion">
                  <strong>Suggestion:</strong> {issue.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompareTab = () => (
    <div className="intelligence-tab-content">
      <div className="compare-header">
        <h3><TrendingUp size={20} /> Document Comparison</h3>
        <p className="compare-description">
          Upload another document to compare with the current one using AI-powered analysis.
        </p>
      </div>
      
      <div className="compare-placeholder">
        <FileText size={48} className="placeholder-icon" />
        <h4>Coming Soon</h4>
        <p>Document comparison feature will be available in the next update.</p>
        <button className="compare-upload-btn" disabled>
          Select Document to Compare
        </button>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="document-intelligence-panel">
      <div className="intelligence-header">
        <h2><Brain size={24} /> Document Intelligence</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="intelligence-tabs">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <FileText size={16} /> Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          <FileSearch size={16} /> Analysis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          <Lightbulb size={16} /> Insights
        </button>
        <button 
          className={`tab-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          <TrendingUp size={16} /> Compare
        </button>
      </div>

      <div className="intelligence-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h3>Analyzing Document with AI...</h3>
            <p>This may take a moment for large documents.</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertTriangle size={48} className="error-icon" />
            <h3>Analysis Failed</h3>
            <p>{error}</p>
            <button className="retry-btn" onClick={generateIntelligence}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'summary' && renderSummaryTab()}
            {activeTab === 'analysis' && renderAnalysisTab()}
            {activeTab === 'insights' && renderInsightsTab()}
            {activeTab === 'compare' && renderCompareTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentIntelligencePanel;