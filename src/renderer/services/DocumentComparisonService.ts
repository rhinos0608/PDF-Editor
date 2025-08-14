import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ComparisonResult {
  id: string;
  document1: DocumentInfo;
  document2: DocumentInfo;
  comparison: ComparisonAnalysis;
  visualDifferences: VisualDifference[];
  textDifferences: TextDifference[];
  structuralDifferences: StructuralDifference[];
  timestamp: Date;
  summary: ComparisonSummary;
}

export interface DocumentInfo {
  name: string;
  pages: number;
  size: number;
  created?: Date;
  modified?: Date;
  version?: string;
  author?: string;
  title?: string;
}

export interface ComparisonAnalysis {
  similarityScore: number; // 0-100%
  confidenceLevel: number; // 0-100%
  totalDifferences: number;
  criticalDifferences: number;
  minorDifferences: number;
  processingTime: number; // milliseconds
  comparisonMethod: 'text' | 'visual' | 'hybrid';
}

export interface VisualDifference {
  id: string;
  type: 'added' | 'removed' | 'modified' | 'moved';
  page: number;
  bbox: { x: number; y: number; width: number; height: number };
  severity: 'critical' | 'major' | 'minor';
  description: string;
  confidence: number;
  visualChange?: {
    oldContent?: string;
    newContent?: string;
    changeType: 'text' | 'image' | 'shape' | 'color' | 'position';
  };
}

export interface TextDifference {
  id: string;
  type: 'insertion' | 'deletion' | 'modification' | 'formatting';
  page: number;
  position: { start: number; end: number };
  oldText?: string;
  newText?: string;
  context: string; // surrounding text
  severity: 'critical' | 'major' | 'minor';
  category: 'content' | 'formatting' | 'metadata';
}

export interface StructuralDifference {
  id: string;
  type: 'page_added' | 'page_removed' | 'page_reordered' | 'bookmark_changed' | 'form_field_changed';
  description: string;
  impact: 'high' | 'medium' | 'low';
  details: any;
}

export interface ComparisonSummary {
  totalChanges: number;
  pagesWithChanges: number[];
  changesByType: { [key: string]: number };
  recommendations: ComparisonRecommendation[];
  keyFindings: string[];
}

export interface ComparisonRecommendation {
  type: 'review_required' | 'auto_merge' | 'manual_review' | 'accept_all' | 'reject_all';
  priority: 'high' | 'medium' | 'low';
  description: string;
  affectedItems: string[];
}

export interface ComparisonOptions {
  method: 'text' | 'visual' | 'hybrid';
  ignoreFormatting: boolean;
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreAnnotations: boolean;
  ignoreForms: boolean;
  sensitivityLevel: 'high' | 'medium' | 'low';
  generateVisualReport: boolean;
}

export class DocumentComparisonService {
  private comparisonHistory: Map<string, ComparisonResult> = new Map();
  private comparisonCache: Map<string, any> = new Map();

  /**
   * Compare two PDF documents comprehensively
   */
  async compareDocuments(
    doc1: { pdf: PDFDocumentProxy; bytes: Uint8Array; name: string },
    doc2: { pdf: PDFDocumentProxy; bytes: Uint8Array; name: string },
    options: Partial<ComparisonOptions> = {}
  ): Promise<ComparisonResult> {
    const startTime = performance.now();
    console.log('🔍 Starting document comparison...', doc1.name, 'vs', doc2.name);

    const comparisonId = this.generateComparisonId(doc1.name, doc2.name);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(doc1.bytes, doc2.bytes, options);
    if (this.comparisonCache.has(cacheKey)) {
      console.log('📋 Using cached comparison result');
      return this.comparisonCache.get(cacheKey);
    }

    const defaultOptions: ComparisonOptions = {
      method: 'hybrid',
      ignoreFormatting: false,
      ignoreWhitespace: false,
      ignoreCase: false,
      ignoreAnnotations: false,
      ignoreForms: false,
      sensitivityLevel: 'medium',
      generateVisualReport: true,
      ...options
    };

    try {
      // Extract document information
      const doc1Info = await this.extractDocumentInfo(doc1.pdf, doc1.bytes, doc1.name);
      const doc2Info = await this.extractDocumentInfo(doc2.pdf, doc2.bytes, doc2.name);

      // Perform different types of comparison
      const textDifferences = await this.compareText(doc1.pdf, doc2.pdf, defaultOptions);
      const visualDifferences = defaultOptions.generateVisualReport 
        ? await this.compareVisual(doc1.pdf, doc2.pdf, defaultOptions)
        : [];
      const structuralDifferences = await this.compareStructure(doc1Info, doc2Info, doc1.pdf, doc2.pdf);

      // Calculate analysis metrics
      const analysis = this.calculateComparisonAnalysis(
        textDifferences,
        visualDifferences,
        structuralDifferences,
        performance.now() - startTime,
        defaultOptions.method
      );

      // Generate summary and recommendations
      const summary = this.generateComparisonSummary(
        textDifferences,
        visualDifferences,
        structuralDifferences
      );

      const result: ComparisonResult = {
        id: comparisonId,
        document1: doc1Info,
        document2: doc2Info,
        comparison: analysis,
        visualDifferences,
        textDifferences,
        structuralDifferences,
        timestamp: new Date(),
        summary
      };

      // Cache the result
      this.comparisonCache.set(cacheKey, result);
      this.comparisonHistory.set(comparisonId, result);

      console.log(`✅ Comparison completed in ${analysis.processingTime}ms`);
      console.log(`📊 Similarity: ${analysis.similarityScore}%, Differences: ${analysis.totalDifferences}`);

      return result;
    } catch (error) {
      console.error('❌ Document comparison failed:', error);
      throw new Error(`Comparison failed: ${error.message}`);
    }
  }

  /**
   * Extract comprehensive document information
   */
  private async extractDocumentInfo(
    pdf: PDFDocumentProxy,
    bytes: Uint8Array,
    name: string
  ): Promise<DocumentInfo> {
    try {
      const pdfDoc = await PDFDocument.load(bytes);
      const metadata = pdfDoc.getInfoDict();

      return {
        name,
        pages: pdf.numPages,
        size: bytes.length,
        created: metadata.CreationDate,
        modified: metadata.ModDate,
        version: pdf.pdfInfo?.PDFFormatVersion || '1.4',
        author: metadata.Author?.toString(),
        title: metadata.Title?.toString()
      };
    } catch (error) {
      console.warn('Failed to extract document metadata:', error);
      return {
        name,
        pages: pdf.numPages,
        size: bytes.length
      };
    }
  }

  /**
   * Compare text content between documents
   */
  private async compareText(
    pdf1: PDFDocumentProxy,
    pdf2: PDFDocumentProxy,
    options: ComparisonOptions
  ): Promise<TextDifference[]> {
    const differences: TextDifference[] = [];
    const maxPages = Math.max(pdf1.numPages, pdf2.numPages);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const text1 = pageNum <= pdf1.numPages 
          ? await this.extractPageText(pdf1, pageNum, options) 
          : '';
        const text2 = pageNum <= pdf2.numPages 
          ? await this.extractPageText(pdf2, pageNum, options) 
          : '';

        const pageDiffs = this.computeTextDifferences(text1, text2, pageNum);
        differences.push(...pageDiffs);
      } catch (error) {
        console.warn(`Failed to compare text on page ${pageNum}:`, error);
      }
    }

    return differences;
  }

  /**
   * Extract and normalize text from a page
   */
  private async extractPageText(
    pdf: PDFDocumentProxy,
    pageNum: number,
    options: ComparisonOptions
  ): Promise<string> {
    try {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let text = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      // Apply normalization based on options
      if (options.ignoreCase) {
        text = text.toLowerCase();
      }
      
      if (options.ignoreWhitespace) {
        text = text.replace(/\s+/g, ' ').trim();
      }

      return text;
    } catch (error) {
      console.warn(`Failed to extract text from page ${pageNum}:`, error);
      return '';
    }
  }

  /**
   * Compute text differences using a diff algorithm
   */
  private computeTextDifferences(text1: string, text2: string, pageNum: number): TextDifference[] {
    const differences: TextDifference[] = [];
    
    // Simple word-based diff implementation
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const lcs = this.longestCommonSubsequence(words1, words2);
    let i = 0, j = 0, pos = 0;
    
    while (i < words1.length || j < words2.length) {
      if (i < words1.length && j < words2.length && words1[i] === words2[j]) {
        // Words match, advance both
        i++;
        j++;
        pos += words1[i - 1].length + 1;
      } else if (i < words1.length && (j >= words2.length || !lcs.includes(words1[i]))) {
        // Word deleted from first document
        const word = words1[i];
        differences.push({
          id: `del_${pageNum}_${pos}`,
          type: 'deletion',
          page: pageNum,
          position: { start: pos, end: pos + word.length },
          oldText: word,
          context: this.getContext(words1, i, 5),
          severity: this.classifyTextSeverity(word),
          category: 'content'
        });
        i++;
        pos += word.length + 1;
      } else if (j < words2.length) {
        // Word added in second document
        const word = words2[j];
        differences.push({
          id: `add_${pageNum}_${pos}`,
          type: 'insertion',
          page: pageNum,
          position: { start: pos, end: pos + word.length },
          newText: word,
          context: this.getContext(words2, j, 5),
          severity: this.classifyTextSeverity(word),
          category: 'content'
        });
        j++;
      }
    }

    return differences;
  }

  /**
   * Compare visual/layout differences (simplified implementation)
   */
  private async compareVisual(
    pdf1: PDFDocumentProxy,
    pdf2: PDFDocumentProxy,
    options: ComparisonOptions
  ): Promise<VisualDifference[]> {
    const differences: VisualDifference[] = [];
    const maxPages = Math.max(pdf1.numPages, pdf2.numPages);

    // This is a simplified implementation
    // In a full implementation, you would:
    // 1. Render pages to canvas
    // 2. Compare pixel differences
    // 3. Identify changed regions
    // 4. Classify types of visual changes

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        if (pageNum > pdf1.numPages) {
          differences.push({
            id: `page_added_${pageNum}`,
            type: 'added',
            page: pageNum,
            bbox: { x: 0, y: 0, width: 612, height: 792 },
            severity: 'major',
            description: 'New page added in second document',
            confidence: 100,
            visualChange: {
              changeType: 'text',
              newContent: 'New page'
            }
          });
        } else if (pageNum > pdf2.numPages) {
          differences.push({
            id: `page_removed_${pageNum}`,
            type: 'removed',
            page: pageNum,
            bbox: { x: 0, y: 0, width: 612, height: 792 },
            severity: 'major',
            description: 'Page removed in second document',
            confidence: 100,
            visualChange: {
              changeType: 'text',
              oldContent: 'Removed page'
            }
          });
        }
        // Additional visual comparison logic would go here
      } catch (error) {
        console.warn(`Failed to compare visual content on page ${pageNum}:`, error);
      }
    }

    return differences;
  }

  /**
   * Compare structural differences
   */
  private async compareStructure(
    doc1Info: DocumentInfo,
    doc2Info: DocumentInfo,
    pdf1: PDFDocumentProxy,
    pdf2: PDFDocumentProxy
  ): Promise<StructuralDifference[]> {
    const differences: StructuralDifference[] = [];

    // Page count differences
    if (doc1Info.pages !== doc2Info.pages) {
      differences.push({
        id: 'page_count_diff',
        type: 'page_added',
        description: `Page count changed from ${doc1Info.pages} to ${doc2Info.pages}`,
        impact: 'high',
        details: {
          oldCount: doc1Info.pages,
          newCount: doc2Info.pages,
          difference: doc2Info.pages - doc1Info.pages
        }
      });
    }

    // Document metadata differences
    if (doc1Info.title !== doc2Info.title) {
      differences.push({
        id: 'title_diff',
        type: 'bookmark_changed',
        description: 'Document title changed',
        impact: 'low',
        details: {
          oldTitle: doc1Info.title,
          newTitle: doc2Info.title
        }
      });
    }

    return differences;
  }

  /**
   * Calculate comprehensive comparison analysis
   */
  private calculateComparisonAnalysis(
    textDiffs: TextDifference[],
    visualDiffs: VisualDifference[],
    structuralDiffs: StructuralDifference[],
    processingTime: number,
    method: string
  ): ComparisonAnalysis {
    const totalDiffs = textDiffs.length + visualDiffs.length + structuralDiffs.length;
    const criticalDiffs = [
      ...textDiffs.filter(d => d.severity === 'critical'),
      ...visualDiffs.filter(d => d.severity === 'critical')
    ].length;

    const minorDiffs = totalDiffs - criticalDiffs;

    // Simple similarity calculation (can be enhanced)
    const similarityScore = Math.max(0, 100 - (totalDiffs * 2));
    const confidenceLevel = totalDiffs < 10 ? 95 : totalDiffs < 50 ? 85 : 70;

    return {
      similarityScore,
      confidenceLevel,
      totalDifferences: totalDiffs,
      criticalDifferences: criticalDiffs,
      minorDifferences: minorDiffs,
      processingTime,
      comparisonMethod: method
    };
  }

  /**
   * Generate comparison summary with recommendations
   */
  private generateComparisonSummary(
    textDiffs: TextDifference[],
    visualDiffs: VisualDifference[],
    structuralDiffs: StructuralDifference[]
  ): ComparisonSummary {
    const totalChanges = textDiffs.length + visualDiffs.length + structuralDiffs.length;
    const pagesWithChanges = Array.from(new Set([
      ...textDiffs.map(d => d.page),
      ...visualDiffs.map(d => d.page)
    ])).sort((a, b) => a - b);

    const changesByType: { [key: string]: number } = {
      text_insertions: textDiffs.filter(d => d.type === 'insertion').length,
      text_deletions: textDiffs.filter(d => d.type === 'deletion').length,
      text_modifications: textDiffs.filter(d => d.type === 'modification').length,
      visual_additions: visualDiffs.filter(d => d.type === 'added').length,
      visual_removals: visualDiffs.filter(d => d.type === 'removed').length,
      visual_modifications: visualDiffs.filter(d => d.type === 'modified').length,
      structural_changes: structuralDiffs.length
    };

    const recommendations = this.generateRecommendations(totalChanges, textDiffs, visualDiffs);
    const keyFindings = this.generateKeyFindings(textDiffs, visualDiffs, structuralDiffs);

    return {
      totalChanges,
      pagesWithChanges,
      changesByType,
      recommendations,
      keyFindings
    };
  }

  /**
   * Generate smart recommendations based on differences
   */
  private generateRecommendations(
    totalChanges: number,
    textDiffs: TextDifference[],
    visualDiffs: VisualDifference[]
  ): ComparisonRecommendation[] {
    const recommendations: ComparisonRecommendation[] = [];

    if (totalChanges === 0) {
      recommendations.push({
        type: 'accept_all',
        priority: 'low',
        description: 'Documents are identical - no changes detected',
        affectedItems: []
      });
    } else if (totalChanges < 5) {
      recommendations.push({
        type: 'review_required',
        priority: 'low',
        description: 'Minor changes detected - quick review recommended',
        affectedItems: textDiffs.slice(0, 3).map(d => d.oldText || d.newText || 'Unknown')
      });
    } else if (totalChanges < 20) {
      recommendations.push({
        type: 'manual_review',
        priority: 'medium',
        description: 'Moderate changes detected - detailed review required',
        affectedItems: [`${textDiffs.length} text changes`, `${visualDiffs.length} visual changes`]
      });
    } else {
      recommendations.push({
        type: 'manual_review',
        priority: 'high',
        description: 'Significant changes detected - comprehensive review required',
        affectedItems: [`${totalChanges} total changes across multiple categories`]
      });
    }

    return recommendations;
  }

  /**
   * Generate key findings summary
   */
  private generateKeyFindings(
    textDiffs: TextDifference[],
    visualDiffs: VisualDifference[],
    structuralDiffs: StructuralDifference[]
  ): string[] {
    const findings: string[] = [];

    if (textDiffs.length > 0) {
      const insertions = textDiffs.filter(d => d.type === 'insertion').length;
      const deletions = textDiffs.filter(d => d.type === 'deletion').length;
      findings.push(`Text changes: ${insertions} additions, ${deletions} deletions`);
    }

    if (visualDiffs.length > 0) {
      findings.push(`Visual changes detected on ${visualDiffs.length} locations`);
    }

    if (structuralDiffs.length > 0) {
      findings.push(`Document structure changes: ${structuralDiffs.length} modifications`);
    }

    if (findings.length === 0) {
      findings.push('No significant differences detected between documents');
    }

    return findings;
  }

  /**
   * Generate comparison report as PDF
   */
  async generateComparisonReport(result: ComparisonResult): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([612, 792]);
    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Title
    page.drawText('Document Comparison Report', {
      x: 50,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0.8)
    });
    yPosition -= 40;

    // Summary
    page.drawText('Comparison Summary', {
      x: 50,
      y: yPosition,
      size: 18,
      font: boldFont
    });
    yPosition -= 25;

    const summaryText = [
      `Documents: ${result.document1.name} vs ${result.document2.name}`,
      `Similarity Score: ${result.comparison.similarityScore}%`,
      `Total Differences: ${result.comparison.totalDifferences}`,
      `Processing Time: ${result.comparison.processingTime.toFixed(2)}ms`,
      `Generated: ${result.timestamp.toLocaleString()}`
    ];

    summaryText.forEach(text => {
      page.drawText(text, {
        x: 70,
        y: yPosition,
        size: 12,
        font
      });
      yPosition -= 20;
    });

    yPosition -= 20;

    // Key Findings
    page.drawText('Key Findings', {
      x: 50,
      y: yPosition,
      size: 16,
      font: boldFont
    });
    yPosition -= 20;

    result.summary.keyFindings.forEach(finding => {
      page.drawText(`• ${finding}`, {
        x: 70,
        y: yPosition,
        size: 11,
        font
      });
      yPosition -= 18;
    });

    return await pdfDoc.save();
  }

  /**
   * Get comparison history
   */
  getComparisonHistory(): ComparisonResult[] {
    return Array.from(this.comparisonHistory.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Clear comparison cache
   */
  clearCache(): void {
    this.comparisonCache.clear();
  }

  // Helper methods

  private generateComparisonId(name1: string, name2: string): string {
    return `comparison_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(bytes1: Uint8Array, bytes2: Uint8Array, options: Partial<ComparisonOptions>): string {
    const hash1 = this.simpleHash(bytes1);
    const hash2 = this.simpleHash(bytes2);
    const optionsHash = this.simpleHash(new TextEncoder().encode(JSON.stringify(options)));
    return `${hash1}_${hash2}_${optionsHash}`;
  }

  private simpleHash(data: Uint8Array): string {
    let hash = 0;
    for (let i = 0; i < Math.min(data.length, 1000); i++) {
      hash = ((hash << 5) - hash + data[i]) & 0xffffffff;
    }
    return hash.toString(36);
  }

  private longestCommonSubsequence(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (arr1[i - 1] === arr2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Reconstruct LCS
    const lcs: string[] = [];
    let i = m, j = n;
    while (i > 0 && j > 0) {
      if (arr1[i - 1] === arr2[j - 1]) {
        lcs.unshift(arr1[i - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }

    return lcs;
  }

  private getContext(words: string[], index: number, contextSize: number): string {
    const start = Math.max(0, index - contextSize);
    const end = Math.min(words.length, index + contextSize + 1);
    return words.slice(start, end).join(' ');
  }

  private classifyTextSeverity(text: string): 'critical' | 'major' | 'minor' {
    // Simple classification based on text properties
    if (text.length > 50 || /\b(contract|agreement|legal|important|critical)\b/i.test(text)) {
      return 'critical';
    } else if (text.length > 20) {
      return 'major';
    } else {
      return 'minor';
    }
  }
}

export default DocumentComparisonService;