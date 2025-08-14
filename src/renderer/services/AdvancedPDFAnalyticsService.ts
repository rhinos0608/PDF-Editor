import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFDocument } from 'pdf-lib';

export interface DocumentMetrics {
  fileSize: number;
  pageDimensions: { width: number; height: number; orientation: 'portrait' | 'landscape' }[];
  pageCount: number;
  fontCount: number;
  imageCount: number;
  formFieldCount: number;
  annotationCount: number;
  signatureCount: number;
  bookmarkCount: number;
  layerCount: number;
  securityFeatures: {
    isEncrypted: boolean;
    hasDigitalSignatures: boolean;
    hasWatermarks: boolean;
    hasRedactions: boolean;
    permissionLevel: string;
  };
  contentAnalysis: {
    textDensity: number;
    imageDensity: number;
    averageWordsPerPage: number;
    mostCommonFonts: Array<{ name: string; usage: number }>;
    colorSpaceUsage: Array<{ type: string; percentage: number }>;
  };
  qualityMetrics: {
    textClarity: number;
    imageQuality: number;
    structuralComplexity: number;
    accessibilityScore: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    memoryUsage: number;
    compressionRatio?: number;
  };
}

export interface DocumentIntelligence {
  documentType: 'text' | 'form' | 'presentation' | 'technical' | 'mixed' | 'scanned';
  language: string;
  readingLevel: number;
  keywords: string[];
  topics: string[];
  sentimentScore?: number;
  confidenceLevel: number;
  contentStructure: {
    hasTableOfContents: boolean;
    hasIndex: boolean;
    hasHeaders: boolean;
    hasFooters: boolean;
    hasPageNumbers: boolean;
    sectionCount: number;
  };
  dataExtraction: {
    tables: Array<{ page: number; rows: number; cols: number; data?: any[][] }>;
    figures: Array<{ page: number; type: 'chart' | 'image' | 'diagram'; description?: string }>;
    forms: Array<{ page: number; fields: Array<{ name: string; type: string; value?: string }> }>;
  };
}

export interface OptimizationSuggestions {
  fileSize: {
    currentSize: number;
    potentialSavings: number;
    suggestions: Array<{ action: string; impact: 'high' | 'medium' | 'low'; description: string }>;
  };
  accessibility: {
    currentScore: number;
    issues: Array<{ type: string; severity: 'error' | 'warning' | 'info'; page?: number; description: string }>;
    improvements: Array<{ action: string; impact: string; description: string }>;
  };
  performance: {
    renderingOptimizations: Array<{ action: string; benefit: string }>;
    memoryOptimizations: Array<{ action: string; benefit: string }>;
  };
  quality: {
    imageOptimizations: Array<{ page: number; action: string; benefit: string }>;
    fontOptimizations: Array<{ action: string; benefit: string }>;
  };
}

export class AdvancedPDFAnalyticsService {
  private performanceMetrics: Map<string, number> = new Map();
  private documentCache: Map<string, DocumentMetrics> = new Map();

  /**
   * Perform comprehensive document analysis
   */
  async analyzeDocument(
    pdf: PDFDocumentProxy, 
    pdfBytes: Uint8Array
  ): Promise<{ metrics: DocumentMetrics; intelligence: DocumentIntelligence; suggestions: OptimizationSuggestions }> {
    const startTime = performance.now();

    // Parallel analysis for better performance
    const [metrics, intelligence] = await Promise.all([
      this.calculateDocumentMetrics(pdf, pdfBytes),
      this.performDocumentIntelligence(pdf, pdfBytes)
    ]);

    const analysisTime = performance.now() - startTime;
    metrics.performance.loadTime = analysisTime;

    const suggestions = await this.generateOptimizationSuggestions(metrics, intelligence);

    return { metrics, intelligence, suggestions };
  }

  /**
   * Calculate comprehensive document metrics
   */
  private async calculateDocumentMetrics(pdf: PDFDocumentProxy, pdfBytes: Uint8Array): Promise<DocumentMetrics> {
    const startTime = performance.now();

    const pageDimensions: { width: number; height: number; orientation: 'portrait' | 'landscape' }[] = [];
    let totalTextContent = '';
    let fontSet = new Set<string>();
    let imageCount = 0;
    let totalWords = 0;

    // Analyze each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      
      // Page dimensions
      const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait';
      pageDimensions.push({
        width: viewport.width,
        height: viewport.height,
        orientation
      });

      // Text content analysis
      try {
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        totalTextContent += pageText + ' ';
        totalWords += pageText.split(/\s+/).filter(word => word.length > 0).length;

        // Font analysis
        textContent.items.forEach((item: any) => {
          if (item.fontName) {
            fontSet.add(item.fontName);
          }
        });
      } catch (error) {
        console.warn(`Could not extract text from page ${pageNum}:`, error);
      }

      // Image analysis (simplified - would need more advanced detection)
      try {
        const ops = await page.getOperatorList();
        imageCount += ops.fnArray.filter((fn: number) => fn === 71 || fn === 74).length; // OPS.paintJpegXObject, OPS.paintImageXObject
      } catch (error) {
        console.warn(`Could not analyze images on page ${pageNum}:`, error);
      }
    }

    const renderTime = performance.now() - startTime;

    // Memory usage estimation (simplified)
    const memoryUsage = pdfBytes.length + (pdf.numPages * 1024 * 1024); // Rough estimate

    return {
      fileSize: pdfBytes.length,
      pageDimensions,
      pageCount: pdf.numPages,
      fontCount: fontSet.size,
      imageCount,
      formFieldCount: 0, // Would need form analysis
      annotationCount: 0, // Would need annotation parsing
      signatureCount: 0, // Would need signature detection
      bookmarkCount: 0, // Would need outline parsing
      layerCount: 0, // Would need layer detection
      securityFeatures: {
        isEncrypted: false, // Would need encryption detection
        hasDigitalSignatures: false,
        hasWatermarks: false,
        hasRedactions: false,
        permissionLevel: 'full'
      },
      contentAnalysis: {
        textDensity: totalTextContent.length / pdf.numPages,
        imageDensity: imageCount / pdf.numPages,
        averageWordsPerPage: totalWords / pdf.numPages,
        mostCommonFonts: Array.from(fontSet).map(font => ({ name: font, usage: 1 })),
        colorSpaceUsage: [{ type: 'RGB', percentage: 100 }] // Simplified
      },
      qualityMetrics: {
        textClarity: this.calculateTextClarity(totalTextContent),
        imageQuality: this.estimateImageQuality(imageCount, pdfBytes.length),
        structuralComplexity: this.calculateStructuralComplexity(pdf.numPages, fontSet.size, imageCount),
        accessibilityScore: this.calculateAccessibilityScore(totalTextContent, imageCount)
      },
      performance: {
        loadTime: 0, // Will be set by caller
        renderTime,
        memoryUsage,
        compressionRatio: this.estimateCompressionRatio(pdfBytes)
      }
    };
  }

  /**
   * Perform advanced document intelligence analysis
   */
  private async performDocumentIntelligence(pdf: PDFDocumentProxy, pdfBytes: Uint8Array): Promise<DocumentIntelligence> {
    let fullText = '';
    
    // Extract all text
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      } catch (error) {
        console.warn(`Could not extract text from page ${pageNum}:`, error);
      }
    }

    return {
      documentType: this.classifyDocumentType(fullText, pdf.numPages),
      language: this.detectLanguage(fullText),
      readingLevel: this.calculateReadingLevel(fullText),
      keywords: this.extractKeywords(fullText),
      topics: this.identifyTopics(fullText),
      sentimentScore: this.analyzeSentiment(fullText),
      confidenceLevel: this.calculateConfidenceLevel(fullText),
      contentStructure: {
        hasTableOfContents: this.detectTableOfContents(fullText),
        hasIndex: this.detectIndex(fullText),
        hasHeaders: this.detectHeaders(fullText),
        hasFooters: this.detectFooters(fullText),
        hasPageNumbers: this.detectPageNumbers(fullText),
        sectionCount: this.countSections(fullText)
      },
      dataExtraction: {
        tables: await this.extractTables(pdf),
        figures: await this.extractFigures(pdf),
        forms: await this.extractForms(pdf)
      }
    };
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizationSuggestions(
    metrics: DocumentMetrics, 
    intelligence: DocumentIntelligence
  ): Promise<OptimizationSuggestions> {
    const fileSizeSuggestions = this.generateFileSizeSuggestions(metrics);
    const accessibilitySuggestions = this.generateAccessibilitySuggestions(metrics, intelligence);
    const performanceSuggestions = this.generatePerformanceSuggestions(metrics);
    const qualitySuggestions = this.generateQualitySuggestions(metrics);

    return {
      fileSize: fileSizeSuggestions,
      accessibility: accessibilitySuggestions,
      performance: performanceSuggestions,
      quality: qualitySuggestions
    };
  }

  // Helper methods for various calculations and analyses

  private calculateTextClarity(text: string): number {
    // Simple heuristic based on character variety and length
    const uniqueChars = new Set(text).size;
    const totalChars = text.length;
    return Math.min(100, (uniqueChars / Math.sqrt(totalChars)) * 100);
  }

  private estimateImageQuality(imageCount: number, fileSize: number): number {
    // Simple heuristic - more images with larger file size suggests higher quality
    if (imageCount === 0) return 100;
    const avgImageSize = fileSize / imageCount;
    return Math.min(100, (avgImageSize / 50000) * 100); // 50KB as baseline
  }

  private calculateStructuralComplexity(pages: number, fonts: number, images: number): number {
    // Complexity based on various elements
    const pageComplexity = Math.min(50, pages * 2);
    const fontComplexity = Math.min(30, fonts * 5);
    const imageComplexity = Math.min(20, images * 2);
    return pageComplexity + fontComplexity + imageComplexity;
  }

  private calculateAccessibilityScore(text: string, imageCount: number): number {
    let score = 100;
    
    // Reduce score for images without alt text (simplified)
    if (imageCount > 0) score -= 20;
    
    // Reduce score for very short or very long texts
    if (text.length < 100) score -= 30;
    if (text.length > 100000) score -= 10;
    
    return Math.max(0, score);
  }

  private estimateCompressionRatio(pdfBytes: Uint8Array): number {
    // Simplified compression ratio estimation
    const uncompressedSize = pdfBytes.length * 3; // Rough estimate
    return pdfBytes.length / uncompressedSize;
  }

  private classifyDocumentType(text: string, pages: number): DocumentIntelligence['documentType'] {
    const formKeywords = ['form', 'application', 'survey', 'questionnaire'];
    const techKeywords = ['specification', 'manual', 'documentation', 'API'];
    const presentationKeywords = ['slide', 'presentation', 'agenda'];
    
    const lowerText = text.toLowerCase();
    
    if (formKeywords.some(keyword => lowerText.includes(keyword))) return 'form';
    if (techKeywords.some(keyword => lowerText.includes(keyword))) return 'technical';
    if (presentationKeywords.some(keyword => lowerText.includes(keyword))) return 'presentation';
    if (text.length < 1000 && pages < 5) return 'scanned';
    
    return 'text';
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on common words
    const commonEnglish = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with'];
    const commonSpanish = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const commonFrench = ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'];
    
    const words = text.toLowerCase().split(/\s+/);
    const englishCount = words.filter(word => commonEnglish.includes(word)).length;
    const spanishCount = words.filter(word => commonSpanish.includes(word)).length;
    const frenchCount = words.filter(word => commonFrench.includes(word)).length;
    
    if (englishCount > spanishCount && englishCount > frenchCount) return 'en';
    if (spanishCount > frenchCount) return 'es';
    if (frenchCount > 0) return 'fr';
    
    return 'en'; // Default to English
  }

  private calculateReadingLevel(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);
    
    // Flesch Reading Ease score (simplified)
    if (words === 0 || sentences === 0) return 0;
    
    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;
    
    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    // Simple syllable counting heuristic
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return words.reduce((total, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return total + Math.max(1, syllableCount);
    }, 0);
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    const frequency: { [key: string]: number } = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  private identifyTopics(text: string): string[] {
    // Simple topic identification based on keyword clusters
    const businessWords = ['business', 'company', 'market', 'revenue', 'profit'];
    const techWords = ['technology', 'software', 'system', 'data', 'digital'];
    const legalWords = ['legal', 'contract', 'agreement', 'law', 'regulation'];
    
    const lowerText = text.toLowerCase();
    const topics: string[] = [];
    
    if (businessWords.some(word => lowerText.includes(word))) topics.push('Business');
    if (techWords.some(word => lowerText.includes(word))) topics.push('Technology');
    if (legalWords.some(word => lowerText.includes(word))) topics.push('Legal');
    
    return topics;
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'success'];
    const negativeWords = ['bad', 'poor', 'negative', 'problem', 'issue'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0;
    
    return (positiveCount - negativeCount) / total;
  }

  private calculateConfidenceLevel(text: string): number {
    // Confidence based on text length and structure
    if (text.length < 100) return 30;
    if (text.length < 1000) return 60;
    if (text.length < 10000) return 80;
    return 95;
  }

  // Content structure detection methods
  private detectTableOfContents(text: string): boolean {
    return /table\s+of\s+contents|contents|toc/i.test(text);
  }

  private detectIndex(text: string): boolean {
    return /index|alphabetical/i.test(text);
  }

  private detectHeaders(text: string): boolean {
    return /chapter|section|part\s+\d+/i.test(text);
  }

  private detectFooters(text: string): boolean {
    return /page\s+\d+|footer/i.test(text);
  }

  private detectPageNumbers(text: string): boolean {
    return /\b\d+\s*$|page\s+\d+/m.test(text);
  }

  private countSections(text: string): number {
    const sectionMarkers = text.match(/\b(chapter|section|part)\s+\d+/gi);
    return sectionMarkers ? sectionMarkers.length : 1;
  }

  // Data extraction methods (simplified implementations)
  private async extractTables(pdf: PDFDocumentProxy): Promise<Array<{ page: number; rows: number; cols: number; data?: any[][] }>> {
    // Would need advanced table detection algorithms
    return [];
  }

  private async extractFigures(pdf: PDFDocumentProxy): Promise<Array<{ page: number; type: 'chart' | 'image' | 'diagram'; description?: string }>> {
    // Would need image analysis and OCR
    return [];
  }

  private async extractForms(pdf: PDFDocumentProxy): Promise<Array<{ page: number; fields: Array<{ name: string; type: string; value?: string }> }>> {
    // Would need form field detection
    return [];
  }

  // Suggestion generation methods
  private generateFileSizeSuggestions(metrics: DocumentMetrics): OptimizationSuggestions['fileSize'] {
    const suggestions = [];
    let potentialSavings = 0;

    if (metrics.imageCount > 5) {
      suggestions.push({
        action: 'Optimize images',
        impact: 'high' as const,
        description: `Reduce image quality and size. Could save up to ${Math.round(metrics.fileSize * 0.3)} bytes.`
      });
      potentialSavings += metrics.fileSize * 0.3;
    }

    if (metrics.fontCount > 10) {
      suggestions.push({
        action: 'Reduce font variety',
        impact: 'medium' as const,
        description: 'Using fewer fonts can reduce file size.'
      });
      potentialSavings += metrics.fileSize * 0.1;
    }

    return {
      currentSize: metrics.fileSize,
      potentialSavings,
      suggestions
    };
  }

  private generateAccessibilitySuggestions(metrics: DocumentMetrics, intelligence: DocumentIntelligence): OptimizationSuggestions['accessibility'] {
    const issues = [];
    const improvements = [];

    if (metrics.imageCount > 0) {
      issues.push({
        type: 'Missing alt text',
        severity: 'warning' as const,
        description: 'Images may not have alternative text descriptions'
      });
      improvements.push({
        action: 'Add alt text to images',
        impact: 'High accessibility improvement',
        description: 'Provide text descriptions for all images'
      });
    }

    if (!intelligence.contentStructure.hasHeaders) {
      issues.push({
        type: 'No heading structure',
        severity: 'error' as const,
        description: 'Document lacks proper heading structure'
      });
    }

    return {
      currentScore: metrics.qualityMetrics.accessibilityScore,
      issues,
      improvements
    };
  }

  private generatePerformanceSuggestions(metrics: DocumentMetrics): OptimizationSuggestions['performance'] {
    return {
      renderingOptimizations: [
        { action: 'Enable page streaming', benefit: 'Faster initial display' },
        { action: 'Optimize page layout', benefit: 'Smoother scrolling' }
      ],
      memoryOptimizations: [
        { action: 'Implement virtual scrolling', benefit: 'Reduced memory usage for large documents' },
        { action: 'Cache frequently accessed pages', benefit: 'Faster navigation' }
      ]
    };
  }

  private generateQualitySuggestions(metrics: DocumentMetrics): OptimizationSuggestions['quality'] {
    return {
      imageOptimizations: [
        { page: 1, action: 'Increase resolution', benefit: 'Better image quality' }
      ],
      fontOptimizations: [
        { action: 'Embed standard fonts', benefit: 'Consistent appearance across devices' }
      ]
    };
  }

  /**
   * Track performance metrics
   */
  recordPerformanceMetric(operation: string, duration: number): void {
    this.performanceMetrics.set(operation, duration);
  }

  /**
   * Get performance insights
   */
  getPerformanceInsights(): { [operation: string]: number } {
    return Object.fromEntries(this.performanceMetrics);
  }

  /**
   * Clear analytics cache
   */
  clearCache(): void {
    this.documentCache.clear();
    this.performanceMetrics.clear();
  }
}

export default AdvancedPDFAnalyticsService;
