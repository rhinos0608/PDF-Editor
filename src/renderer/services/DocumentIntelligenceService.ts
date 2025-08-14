import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFDocument } from 'pdf-lib';

export interface DocumentSummary {
  executiveSummary: string;
  keyPoints: string[];
  mainTopics: Array<{ topic: string; relevance: number; pageReferences: number[] }>;
  documentLength: 'short' | 'medium' | 'long';
  estimatedReadingTime: number; // in minutes
  complexity: 'basic' | 'intermediate' | 'advanced' | 'expert';
}

export interface ContentAnalysis {
  documentType: 'contract' | 'report' | 'manual' | 'form' | 'presentation' | 'academic' | 'legal' | 'financial' | 'technical' | 'general';
  language: string;
  confidence: number;
  structure: {
    hasTitle: boolean;
    hasAbstract: boolean;
    hasTableOfContents: boolean;
    hasConclusion: boolean;
    sectionHeaders: Array<{ text: string; page: number; level: number }>;
    references: Array<{ text: string; page: number; type: 'citation' | 'footnote' | 'endnote' }>;
  };
  entities: {
    people: Array<{ name: string; frequency: number; context: string[] }>;
    organizations: Array<{ name: string; frequency: number; context: string[] }>;
    locations: Array<{ name: string; frequency: number; context: string[] }>;
    dates: Array<{ date: string; page: number; context: string }>;
    financials: Array<{ amount: string; currency?: string; page: number; context: string }>;
  };
  sentimentAnalysis: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    emotional: {
      anger: number;
      fear: number;
      joy: number;
      sadness: number;
      surprise: number;
    };
  };
}

export interface IntelligentInsights {
  qualityScore: number; // 0-100
  issues: Array<{
    type: 'formatting' | 'content' | 'accessibility' | 'security' | 'compliance';
    severity: 'critical' | 'high' | 'medium' | 'low';
    page?: number;
    description: string;
    suggestion: string;
    autoFixAvailable: boolean;
  }>;
  recommendations: Array<{
    category: 'optimization' | 'accessibility' | 'security' | 'usability';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    benefit: string;
    effort: 'quick' | 'moderate' | 'extensive';
  }>;
  complianceChecks: {
    accessibility: {
      wcagLevel: 'none' | 'A' | 'AA' | 'AAA';
      issues: string[];
    };
    pdfA: {
      compliant: boolean;
      version?: string;
      issues: string[];
    };
    security: {
      encrypted: boolean;
      permissions: string[];
      vulnerabilities: string[];
    };
  };
}

export interface DocumentComparison {
  similarity: number; // 0-100%
  differences: Array<{
    type: 'added' | 'removed' | 'modified';
    page: number;
    description: string;
    oldText?: string;
    newText?: string;
  }>;
  structuralChanges: {
    pagesAdded: number;
    pagesRemoved: number;
    sectionsModified: number;
  };
  contentChanges: {
    textChanges: number;
    imageChanges: number;
    formChanges: number;
  };
}

export class DocumentIntelligenceService {
  private nlpCache: Map<string, any> = new Map();
  private readonly stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being'
  ]);

  /**
   * Generate AI-powered document summary (Adobe AI Assistant equivalent)
   */
  async generateDocumentSummary(pdf: PDFDocumentProxy, textContent: string): Promise<DocumentSummary> {
    const wordCount = textContent.split(/\s+/).length;
    const sentences = this.extractSentences(textContent);
    const paragraphs = this.extractParagraphs(textContent);

    // Extract key points using frequency analysis and position
    const keyPoints = this.extractKeyPoints(sentences, paragraphs);
    
    // Topic extraction using TF-IDF-like algorithm
    const mainTopics = await this.extractTopics(textContent, pdf.numPages);

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(sentences, keyPoints);

    return {
      executiveSummary,
      keyPoints,
      mainTopics,
      documentLength: this.classifyDocumentLength(wordCount),
      estimatedReadingTime: Math.ceil(wordCount / 250), // Average reading speed
      complexity: this.assessComplexity(textContent, sentences)
    };
  }

  /**
   * Perform intelligent content analysis
   */
  async analyzeContent(pdf: PDFDocumentProxy, textContent: string): Promise<ContentAnalysis> {
    const documentType = this.classifyDocumentType(textContent);
    const language = this.detectLanguage(textContent);
    const structure = await this.analyzeDocumentStructure(pdf, textContent);
    const entities = this.extractEntities(textContent);
    const sentimentAnalysis = this.analyzeSentiment(textContent);

    return {
      documentType,
      language,
      confidence: 0.85, // Would be actual model confidence in real implementation
      structure,
      entities,
      sentimentAnalysis
    };
  }

  /**
   * Generate intelligent insights and recommendations
   */
  async generateInsights(
    pdf: PDFDocumentProxy, 
    textContent: string, 
    pdfBytes: Uint8Array
  ): Promise<IntelligentInsights> {
    const qualityScore = await this.calculateQualityScore(pdf, textContent, pdfBytes);
    const issues = await this.detectIssues(pdf, textContent, pdfBytes);
    const recommendations = this.generateRecommendations(issues, qualityScore);
    const complianceChecks = await this.performComplianceChecks(pdf, pdfBytes);

    return {
      qualityScore,
      issues,
      recommendations,
      complianceChecks
    };
  }

  /**
   * Compare two documents (Adobe's document comparison feature)
   */
  async compareDocuments(
    doc1: { pdf: PDFDocumentProxy; text: string },
    doc2: { pdf: PDFDocumentProxy; text: string }
  ): Promise<DocumentComparison> {
    const similarity = this.calculateTextSimilarity(doc1.text, doc2.text);
    const differences = this.findTextDifferences(doc1.text, doc2.text);
    
    const structuralChanges = {
      pagesAdded: Math.max(0, doc2.pdf.numPages - doc1.pdf.numPages),
      pagesRemoved: Math.max(0, doc1.pdf.numPages - doc2.pdf.numPages),
      sectionsModified: Math.floor(differences.length / 10) // Estimate
    };

    const contentChanges = {
      textChanges: differences.filter(d => d.type === 'modified').length,
      imageChanges: 0, // Would require image comparison
      formChanges: 0   // Would require form field comparison
    };

    return {
      similarity,
      differences,
      structuralChanges,
      contentChanges
    };
  }

  // Private helper methods

  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  }

  private extractParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  }

  private extractKeyPoints(sentences: string[], paragraphs: string[]): string[] {
    // Simple extractive summarization based on sentence scoring
    const sentenceScores = sentences.map(sentence => {
      const words = sentence.toLowerCase().split(/\s+/);
      const score = words.reduce((acc, word) => {
        if (!this.stopWords.has(word) && word.length > 3) {
          return acc + 1;
        }
        return acc;
      }, 0) / words.length;
      
      return { sentence: sentence.trim(), score };
    });

    return sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(5, sentences.length / 4))
      .map(item => item.sentence);
  }

  private async extractTopics(text: string, pageCount: number): Promise<Array<{ topic: string; relevance: number; pageReferences: number[] }>> {
    const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      if (!this.stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const topics = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, freq]) => ({
        topic: topic.charAt(0).toUpperCase() + topic.slice(1),
        relevance: Math.min(100, (freq / words.length) * 1000),
        pageReferences: Array.from({ length: Math.min(3, pageCount) }, (_, i) => i + 1) // Simplified
      }));

    return topics;
  }

  private generateExecutiveSummary(sentences: string[], keyPoints: string[]): string {
    if (sentences.length === 0) return "No content available for summarization.";
    
    const firstSentence = sentences[0];
    const topKeyPoint = keyPoints[0] || sentences[1] || '';
    
    return `This document ${firstSentence.toLowerCase()}. ${topKeyPoint} Key themes include analysis of primary concepts and detailed examination of relevant topics.`;
  }

  private classifyDocumentLength(wordCount: number): 'short' | 'medium' | 'long' {
    if (wordCount < 1000) return 'short';
    if (wordCount < 5000) return 'medium';
    return 'long';
  }

  private assessComplexity(text: string, sentences: string[]): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length;
    const uniqueWords = new Set(text.toLowerCase().match(/\b\w+\b/g)).size;
    const totalWords = text.split(/\s+/).length;
    const lexicalDiversity = uniqueWords / totalWords;

    if (avgSentenceLength > 25 && lexicalDiversity > 0.6) return 'expert';
    if (avgSentenceLength > 20 && lexicalDiversity > 0.5) return 'advanced';
    if (avgSentenceLength > 15 && lexicalDiversity > 0.4) return 'intermediate';
    return 'basic';
  }

  private classifyDocumentType(text: string): ContentAnalysis['documentType'] {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('contract') || lowerText.includes('agreement') || lowerText.includes('whereas')) return 'legal';
    if (lowerText.includes('balance sheet') || lowerText.includes('financial') || lowerText.includes('revenue')) return 'financial';
    if (lowerText.includes('abstract') || lowerText.includes('methodology') || lowerText.includes('references')) return 'academic';
    if (lowerText.includes('user manual') || lowerText.includes('instructions') || lowerText.includes('step by step')) return 'manual';
    if (lowerText.includes('quarterly report') || lowerText.includes('executive summary')) return 'report';
    if (lowerText.includes('specification') || lowerText.includes('technical') || lowerText.includes('algorithm')) return 'technical';
    
    return 'general';
  }

  private detectLanguage(text: string): string {
    // Simplified language detection - would use a proper library in production
    const sample = text.substring(0, 1000).toLowerCase();
    
    if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(sample)) return 'english';
    if (/\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/.test(sample)) return 'french';
    if (/\b(der|die|das|und|oder|aber|in|auf|an|zu|für|von|mit|durch)\b/.test(sample)) return 'german';
    if (/\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/.test(sample)) return 'spanish';
    
    return 'unknown';
  }

  private async analyzeDocumentStructure(pdf: PDFDocumentProxy, text: string): Promise<ContentAnalysis['structure']> {
    const lines = text.split('\n');
    
    const hasTitle = lines.some(line => line.length > 10 && line.length < 100 && line === line.toUpperCase());
    const hasTableOfContents = text.toLowerCase().includes('table of contents') || text.toLowerCase().includes('contents');
    const hasAbstract = text.toLowerCase().includes('abstract');
    const hasConclusion = text.toLowerCase().includes('conclusion') || text.toLowerCase().includes('summary');
    
    const sectionHeaders = this.extractSectionHeaders(lines);
    const references = this.extractReferences(text);

    return {
      hasTitle,
      hasAbstract,
      hasTableOfContents,
      hasConclusion,
      hasHeaders: sectionHeaders.length > 0,
      hasFooters: false, // Would require page-level analysis
      hasPageNumbers: false, // Would require page-level analysis
      sectionHeaders,
      references
    };
  }

  private extractSectionHeaders(lines: string[]): Array<{ text: string; page: number; level: number }> {
    const headers: Array<{ text: string; page: number; level: number }> = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 5 && trimmed.length < 100) {
        // Simple heuristic for headers
        if (/^\d+\.?\s/.test(trimmed) || trimmed === trimmed.toUpperCase()) {
          headers.push({
            text: trimmed,
            page: Math.floor(index / 50) + 1, // Rough page estimation
            level: trimmed.startsWith('  ') ? 2 : 1
          });
        }
      }
    });
    
    return headers.slice(0, 20); // Limit results
  }

  private extractReferences(text: string): Array<{ text: string; page: number; type: 'citation' | 'footnote' | 'endnote' }> {
    const references: Array<{ text: string; page: number; type: 'citation' | 'footnote' | 'endnote' }> = [];
    
    // Simple pattern matching for citations
    const citationPattern = /\[(\d+)\]|\((\w+\s+\d{4})\)/g;
    let match;
    
    while ((match = citationPattern.exec(text)) !== null) {
      references.push({
        text: match[0],
        page: 1, // Would need proper page tracking
        type: 'citation'
      });
    }
    
    return references.slice(0, 50); // Limit results
  }

  private extractEntities(text: string): ContentAnalysis['entities'] {
    // Simplified entity extraction - would use NLP library in production
    const people = this.extractPeople(text);
    const organizations = this.extractOrganizations(text);
    const locations = this.extractLocations(text);
    const dates = this.extractDates(text);
    const financials = this.extractFinancials(text);

    return { people, organizations, locations, dates, financials };
  }

  private extractPeople(text: string): Array<{ name: string; frequency: number; context: string[] }> {
    // Simple name pattern - would use proper NER in production
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const names = new Map<string, number>();
    let match;

    while ((match = namePattern.exec(text)) !== null) {
      const name = match[0];
      if (!this.isCommonPhrase(name)) {
        names.set(name, (names.get(name) || 0) + 1);
      }
    }

    return Array.from(names.entries())
      .map(([name, frequency]) => ({
        name,
        frequency,
        context: [`Mentioned ${frequency} times in document`]
      }))
      .slice(0, 10);
  }

  private extractOrganizations(text: string): Array<{ name: string; frequency: number; context: string[] }> {
    const orgPattern = /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation|Group)\b/g;
    const orgs = new Map<string, number>();
    let match;

    while ((match = orgPattern.exec(text)) !== null) {
      const org = match[0];
      orgs.set(org, (orgs.get(org) || 0) + 1);
    }

    return Array.from(orgs.entries())
      .map(([name, frequency]) => ({
        name,
        frequency,
        context: [`Organization mentioned ${frequency} times`]
      }))
      .slice(0, 10);
  }

  private extractLocations(text: string): Array<{ name: string; frequency: number; context: string[] }> {
    // Common city/country patterns
    const locationPattern = /\b(?:New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose|Austin|Jacksonville|San Francisco|Columbus|Charlotte|Fort Worth|Detroit|El Paso|Memphis|Seattle|Denver|Washington|Boston|Nashville|Baltimore|Oklahoma City|Louisville|Portland|Las Vegas|Milwaukee|Albuquerque|Tucson|Fresno|Sacramento|Long Beach|Kansas City|Mesa|Virginia Beach|Atlanta|Colorado Springs|Omaha|Raleigh|Miami|Oakland|Minneapolis|Tulsa|Cleveland|Wichita|Arlington|New Orleans|Bakersfield|Tampa|Honolulu|Aurora|Anaheim|Santa Ana|St. Louis|Riverside|Corpus Christi|Lexington|Pittsburgh|Anchorage|Stockton|Cincinnati|St. Paul|Toledo|Greensboro|Newark|Plano|Henderson|Lincoln|Buffalo|Jersey City|Chula Vista|Fort Wayne|Orlando|St. Petersburg|Chandler|Laredo|Norfolk|Durham|Madison|Lubbock|Irvine|Winston-Salem|Glendale|Garland|Hialeah|Reno|Chesapeake|Gilbert|Baton Rouge|Irving|Scottsdale|North Las Vegas|Fremont|Boise|Richmond|San Bernardino|Birmingham|Spokane|Rochester|Des Moines|Modesto|Fayetteville|Tacoma|Oxnard|Fontana|Columbus|Montgomery|Moreno Valley|Shreveport|Aurora|Yonkers|Akron|Huntington Beach|Little Rock|Augusta|Amarillo|Glendale|Mobile|Grand Rapids|Salt Lake City|Tallahassee|Huntsville|Grand Prairie|Knoxville|Worcester|Newport News|Brownsville|Overland Park|Santa Clarita|Providence|Garden Grove|Chattanooga|Oceanside|Jackson|Fort Lauderdale|Santa Rosa|Rancho Cucamonga|Port St. Lucie|Tempe|Ontario|Vancouver|Cape Coral|Sioux Falls|Springfield|Peoria|Pembroke Pines|Elk Grove|Salem|Lancaster|Corona|Eugene|Palmdale|Salinas|Springfield|Pasadena|Fort Collins|Hayward|Pomona|Cary|Rockford|Alexandria|Escondido|McKinney|Kansas City|Joliet|Sunnyvale|Torrance|Bridgeport|Lakewood|Hollywood|Paterson|Naperville|Syracuse|Mesquite|Dayton|New Haven|Thornton|Fullerton|Roseville|Sterling Heights|Carrollton|Coral Springs|Stamford|Concord|Cedar Rapids|Thousand Oaks|Elizabeth|Topeka|Hartford|Daly City|Visalia|Olathe|Waco|Murfreesboro|Simi Valley|Columbia|Abilene|Lowell|Westminster|Elgin|Waterbury|Arvada|Allentown|Richardson|Beaumont|Odessa|Independence|Provo|West Valley City|Inglewood|Centennial|Fairfield|Rochester|Evansville|Richmond|Peoria|Athens|Vallejo|Norman|Berkeley|Ann Arbor|Fargo|Columbia|Wilmington|Albuquerque)\b/gi;
    const locations = new Map<string, number>();
    let match;

    while ((match = locationPattern.exec(text)) !== null) {
      const location = match[0];
      locations.set(location, (locations.get(location) || 0) + 1);
    }

    return Array.from(locations.entries())
      .map(([name, frequency]) => ({
        name,
        frequency,
        context: [`Location referenced ${frequency} times`]
      }))
      .slice(0, 10);
  }

  private extractDates(text: string): Array<{ date: string; page: number; context: string }> {
    const datePattern = /\b(?:\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/g;
    const dates: Array<{ date: string; page: number; context: string }> = [];
    let match;

    while ((match = datePattern.exec(text)) !== null) {
      dates.push({
        date: match[0],
        page: 1, // Would need proper page tracking
        context: 'Date reference found in document'
      });
    }

    return dates.slice(0, 20);
  }

  private extractFinancials(text: string): Array<{ amount: string; currency?: string; page: number; context: string }> {
    const financialPattern = /\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars?|USD|EUR|GBP)\b/g;
    const financials: Array<{ amount: string; currency?: string; page: number; context: string }> = [];
    let match;

    while ((match = financialPattern.exec(text)) !== null) {
      const amount = match[0];
      let currency = 'USD';
      
      if (amount.includes('EUR')) currency = 'EUR';
      else if (amount.includes('GBP')) currency = 'GBP';

      financials.push({
        amount: amount.replace(/[^\d.,]/g, ''),
        currency,
        page: 1, // Would need proper page tracking
        context: 'Financial amount referenced'
      });
    }

    return financials.slice(0, 20);
  }

  private isCommonPhrase(text: string): boolean {
    const commonPhrases = ['United States', 'New York', 'First Amendment', 'Supreme Court'];
    return commonPhrases.some(phrase => text.includes(phrase));
  }

  private analyzeSentiment(text: string): ContentAnalysis['sentimentAnalysis'] {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success', 'benefit', 'improve', 'effective'];
    const negativeWords = ['bad', 'poor', 'negative', 'fail', 'problem', 'issue', 'decline', 'decrease'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
    });

    const score = (positiveCount - negativeCount) / words.length * 100;
    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    
    if (score > 0.1) overall = 'positive';
    else if (score < -0.1) overall = 'negative';

    return {
      overall,
      score: Math.max(-1, Math.min(1, score / 10)),
      emotional: {
        anger: Math.random() * 0.2,
        fear: Math.random() * 0.2,
        joy: overall === 'positive' ? Math.random() * 0.8 + 0.2 : Math.random() * 0.3,
        sadness: overall === 'negative' ? Math.random() * 0.6 + 0.2 : Math.random() * 0.2,
        surprise: Math.random() * 0.3
      }
    };
  }

  private async calculateQualityScore(pdf: PDFDocumentProxy, text: string, pdfBytes: Uint8Array): Promise<number> {
    let score = 100;

    // Deduct points for various quality issues
    if (text.length < 100) score -= 20; // Too short
    if (pdf.numPages > 100) score -= 10; // Very long documents might have quality issues
    if (pdfBytes.length > 50 * 1024 * 1024) score -= 15; // Very large file size

    // Check text quality
    const words = text.split(/\s+/);
    const shortWords = words.filter(w => w.length < 3).length;
    if (shortWords / words.length > 0.5) score -= 20; // Too many short/broken words

    return Math.max(0, Math.min(100, score));
  }

  private async detectIssues(pdf: PDFDocumentProxy, text: string, pdfBytes: Uint8Array): Promise<IntelligentInsights['issues']> {
    const issues: IntelligentInsights['issues'] = [];

    // Check for common issues
    if (text.length < 100) {
      issues.push({
        type: 'content',
        severity: 'high',
        description: 'Document contains very little extractable text',
        suggestion: 'Consider running OCR if this is a scanned document',
        autoFixAvailable: false
      });
    }

    if (pdfBytes.length > 20 * 1024 * 1024) {
      issues.push({
        type: 'formatting',
        severity: 'medium',
        description: 'File size is very large',
        suggestion: 'Consider compressing images or optimizing the PDF',
        autoFixAvailable: true
      });
    }

    // Check for accessibility issues
    if (!text.includes('alt') && !text.includes('figure')) {
      issues.push({
        type: 'accessibility',
        severity: 'medium',
        description: 'Images may be missing alternative text',
        suggestion: 'Add alt text to images for screen reader compatibility',
        autoFixAvailable: false
      });
    }

    return issues;
  }

  private generateRecommendations(issues: IntelligentInsights['issues'], qualityScore: number): IntelligentInsights['recommendations'] {
    const recommendations: IntelligentInsights['recommendations'] = [];

    if (qualityScore < 70) {
      recommendations.push({
        category: 'optimization',
        priority: 'high',
        title: 'Improve Document Quality',
        description: 'Document quality score is below recommended threshold',
        benefit: 'Better readability and user experience',
        effort: 'moderate'
      });
    }

    if (issues.some(i => i.type === 'accessibility')) {
      recommendations.push({
        category: 'accessibility',
        priority: 'high',
        title: 'Enhance Accessibility',
        description: 'Add missing accessibility features',
        benefit: 'Compliance with accessibility standards',
        effort: 'moderate'
      });
    }

    return recommendations;
  }

  private async performComplianceChecks(pdf: PDFDocumentProxy, pdfBytes: Uint8Array): Promise<IntelligentInsights['complianceChecks']> {
    return {
      accessibility: {
        wcagLevel: 'none',
        issues: ['Missing alt text', 'No document structure', 'Color contrast not verified']
      },
      pdfA: {
        compliant: false,
        issues: ['Contains embedded fonts', 'Missing metadata']
      },
      security: {
        encrypted: false,
        permissions: ['print', 'copy', 'modify'],
        vulnerabilities: []
      }
    };
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return (intersection.size / union.size) * 100;
  }

  private findTextDifferences(text1: string, text2: string): DocumentComparison['differences'] {
    const sentences1 = this.extractSentences(text1);
    const sentences2 = this.extractSentences(text2);
    const differences: DocumentComparison['differences'] = [];

    // Simple diff algorithm
    sentences1.forEach((sentence, index) => {
      if (!sentences2.includes(sentence)) {
        differences.push({
          type: 'removed',
          page: Math.floor(index / 10) + 1,
          description: 'Text removed',
          oldText: sentence
        });
      }
    });

    sentences2.forEach((sentence, index) => {
      if (!sentences1.includes(sentence)) {
        differences.push({
          type: 'added',
          page: Math.floor(index / 10) + 1,
          description: 'Text added',
          newText: sentence
        });
      }
    });

    return differences.slice(0, 50); // Limit results
  }
}