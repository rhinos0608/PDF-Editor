import { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';

export interface SearchResult {
  page: number;
  text: string;
  context: string;
  index: number;
  matchStart: number;
  matchEnd: number;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
}

export class SearchService {
  private textCache: Map<number, string> = new Map();
  private pdf: PDFDocumentProxy | null = null;
  private currentResults: SearchResult[] = [];
  private currentIndex: number = -1;

  /**
   * Initialize search service with a PDF document
   */
  async initialize(pdf: PDFDocumentProxy): Promise<void> {
    this.pdf = pdf;
    this.textCache.clear();
    this.currentResults = [];
    this.currentIndex = -1;
    
    // Pre-cache text for better performance
    await this.cacheAllPageText();
  }

  /**
   * Cache text content from all pages for faster searching
   */
  private async cacheAllPageText(): Promise<void> {
    if (!this.pdf) return;

    const cachePromises: Promise<void>[] = [];
    
    for (let pageNum = 1; pageNum <= this.pdf.numPages; pageNum++) {
      cachePromises.push(this.cachePageText(pageNum));
    }
    
    await Promise.all(cachePromises);
  }

  /**
   * Cache text from a specific page
   */
  private async cachePageText(pageNum: number): Promise<void> {
    if (!this.pdf) return;
    
    try {
      const page = await this.pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items into a single string
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      this.textCache.set(pageNum, pageText);
    } catch (error) {
      console.error(`Failed to cache text for page ${pageNum}:`, error);
      this.textCache.set(pageNum, '');
    }
  }

  /**
   * Search for text across all pages
   */
  async search(
    searchText: string,
    options: SearchOptions = { caseSensitive: false, wholeWord: false, regex: false }
  ): Promise<SearchResult[]> {
    if (!this.pdf || !searchText) {
      return [];
    }

    this.currentResults = [];
    const pattern = this.buildSearchPattern(searchText, options);
    
    for (let pageNum = 1; pageNum <= this.pdf.numPages; pageNum++) {
      const pageText = this.textCache.get(pageNum) || '';
      if (!pageText) continue;
      
      const matches = this.findMatches(pageText, pattern, options);
      
      for (const match of matches) {
        this.currentResults.push({
          page: pageNum,
          text: match.text,
          context: match.context,
          index: this.currentResults.length,
          matchStart: match.start,
          matchEnd: match.end
        });
      }
    }
    
    this.currentIndex = this.currentResults.length > 0 ? 0 : -1;
    return this.currentResults;
  }

  /**
   * Build search pattern based on options
   */
  private buildSearchPattern(searchText: string, options: SearchOptions): RegExp {
    let pattern = searchText;
    
    // Escape special regex characters if not using regex mode
    if (!options.regex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Add word boundaries if whole word search
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    const flags = options.caseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  /**
   * Find matches in text with context
   */
  private findMatches(
    text: string,
    pattern: RegExp,
    options: SearchOptions
  ): Array<{ text: string; context: string; start: number; end: number }> {
    const matches: Array<{ text: string; context: string; start: number; end: number }> = [];
    const contextLength = 50; // Characters before and after match
    
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
      // Extract context around the match
      const contextStart = Math.max(0, start - contextLength);
      const contextEnd = Math.min(text.length, end + contextLength);
      let context = text.substring(contextStart, contextEnd);
      
      // Add ellipsis if context is truncated
      if (contextStart > 0) context = '...' + context;
      if (contextEnd < text.length) context = context + '...';
      
      matches.push({
        text: match[0],
        context,
        start,
        end
      });
    }
    
    return matches;
  }

  /**
   * Get next search result
   */
  getNextResult(): SearchResult | null {
    if (this.currentResults.length === 0) return null;
    
    this.currentIndex = (this.currentIndex + 1) % this.currentResults.length;
    return this.currentResults[this.currentIndex];
  }

  /**
   * Get previous search result
   */
  getPreviousResult(): SearchResult | null {
    if (this.currentResults.length === 0) return null;
    
    this.currentIndex = this.currentIndex - 1;
    if (this.currentIndex < 0) {
      this.currentIndex = this.currentResults.length - 1;
    }
    
    return this.currentResults[this.currentIndex];
  }

  /**
   * Clear search results and cache
   */
  clear(): void {
    this.textCache.clear();
    this.currentResults = [];
    this.currentIndex = -1;
    this.pdf = null;
  }

  /**
   * Get current search statistics
   */
  getSearchStats(): { total: number; current: number } {
    return {
      total: this.currentResults.length,
      current: this.currentIndex + 1
    };
  }

  /**
   * Highlight text on a specific page
   */
  async highlightSearchResults(
    pageNum: number,
    canvas: HTMLCanvasElement
  ): Promise<void> {
    const pageResults = this.currentResults.filter(r => r.page === pageNum);
    if (pageResults.length === 0 || !this.pdf) return;
    
    try {
      const page = await this.pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Set highlight style
      context.fillStyle = 'rgba(255, 237, 0, 0.4)';
      
      for (const result of pageResults) {
        // Find text item positions
        for (const item of textContent.items as any[]) {
          if (item.str.includes(result.text)) {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5];
            const width = item.width;
            const height = item.height;
            
            // Draw highlight rectangle
            context.fillRect(x, y - height, width, height);
          }
        }
      }
    } catch (error) {
      console.error('Failed to highlight search results:', error);
    }
  }

  /**
   * Find and replace text (for future implementation)
   */
  async findAndReplace(
    findText: string,
    replaceText: string,
    options: SearchOptions
  ): Promise<number> {
    // This would require modifying the PDF content directly
    // Implementation would use pdf-lib to edit text
    console.log('Find and replace not yet implemented');
    return 0;
  }
}

// Singleton instance
export const searchService = new SearchService();
