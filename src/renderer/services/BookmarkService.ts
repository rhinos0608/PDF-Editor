import { PDFDocument, PDFDict, PDFName, PDFArray, PDFRef, PDFString, PDFNumber, rgb } from 'pdf-lib';

export interface Bookmark {
  id: string;
  title: string;
  pageNumber: number;
  x?: number;
  y?: number;
  zoom?: number;
  level: number;
  parent?: string;
  children: string[];
  isOpen: boolean;
  color?: { r: number; g: number; b: number };
  style?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  action?: BookmarkAction;
}

export interface BookmarkAction {
  type: 'goto' | 'uri' | 'javascript' | 'named' | 'launch';
  destination?: {
    pageNumber: number;
    x?: number;
    y?: number;
    zoom?: number;
    fit?: 'fit' | 'fitH' | 'fitV' | 'fitR' | 'fitB' | 'fitBH' | 'fitBV';
  };
  uri?: string;
  javascript?: string;
  namedAction?: 'NextPage' | 'PrevPage' | 'FirstPage' | 'LastPage' | 'Print' | 'Close';
  file?: string;
}

export interface OutlineNode {
  title: string;
  level: number;
  pageNumber: number;
  children: OutlineNode[];
  x?: number;
  y?: number;
  isExpanded: boolean;
}

export interface TableOfContents {
  title: string;
  entries: TOCEntry[];
  style: {
    fontSize: number;
    fontFamily: string;
    showPageNumbers: boolean;
    showDots: boolean;
    indentSize: number;
  };
}

export interface TOCEntry {
  title: string;
  pageNumber: number;
  level: number;
  children: TOCEntry[];
}

export interface NavigationHistory {
  current: number;
  items: Array<{
    pageNumber: number;
    x?: number;
    y?: number;
    zoom?: number;
    timestamp: Date;
    title?: string;
  }>;
}

export class BookmarkService {
  private bookmarks: Map<string, Bookmark> = new Map();
  private rootBookmarks: string[] = [];
  private navigationHistory: NavigationHistory = {
    current: -1,
    items: []
  };

  /**
   * Extract existing bookmarks from PDF
   */
  async extractBookmarks(pdfBytes: Uint8Array): Promise<Bookmark[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const catalog = pdfDoc.catalog;
      
      // Note: pdf-lib doesn't have built-in bookmark extraction
      // This would require low-level PDF parsing
      // For now, return empty array and implement basic bookmark structure
      
      console.warn('Bookmark extraction requires advanced PDF parsing - using basic implementation');
      return [];
    } catch (error) {
      console.error('Error extracting bookmarks:', error);
      return [];
    }
  }

  /**
   * Add bookmark to PDF
   */
  async addBookmark(
    pdfBytes: Uint8Array,
    bookmark: Omit<Bookmark, 'id' | 'children'>
  ): Promise<{ pdfBytes: Uint8Array; bookmarkId: string }> {
    try {
      const bookmarkId = this.generateId();
      const newBookmark: Bookmark = {
        ...bookmark,
        id: bookmarkId,
        children: []
      };

      this.bookmarks.set(bookmarkId, newBookmark);

      // Add to parent's children or root level
      if (bookmark.parent) {
        const parent = this.bookmarks.get(bookmark.parent);
        if (parent) {
          parent.children.push(bookmarkId);
        }
      } else {
        this.rootBookmarks.push(bookmarkId);
      }

      // Add bookmark metadata to PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const bookmarkData = {
        bookmarks: Array.from(this.bookmarks.values()),
        rootBookmarks: this.rootBookmarks
      };

      pdfDoc.setSubject(`BOOKMARKS:${JSON.stringify(bookmarkData)}`);

      return {
        pdfBytes: await pdfDoc.save(),
        bookmarkId
      };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw new Error('Failed to add bookmark');
    }
  }

  /**
   * Remove bookmark
   */
  async removeBookmark(
    pdfBytes: Uint8Array,
    bookmarkId: string
  ): Promise<Uint8Array> {
    try {
      const bookmark = this.bookmarks.get(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      // Remove from parent's children
      if (bookmark.parent) {
        const parent = this.bookmarks.get(bookmark.parent);
        if (parent) {
          parent.children = parent.children.filter(id => id !== bookmarkId);
        }
      } else {
        this.rootBookmarks = this.rootBookmarks.filter(id => id !== bookmarkId);
      }

      // Remove bookmark and all its children recursively
      this.removeBookmarkRecursively(bookmarkId);

      // Update PDF metadata
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const bookmarkData = {
        bookmarks: Array.from(this.bookmarks.values()),
        rootBookmarks: this.rootBookmarks
      };

      pdfDoc.setSubject(`BOOKMARKS:${JSON.stringify(bookmarkData)}`);

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw new Error('Failed to remove bookmark');
    }
  }

  /**
   * Update bookmark
   */
  async updateBookmark(
    pdfBytes: Uint8Array,
    bookmarkId: string,
    updates: Partial<Bookmark>
  ): Promise<Uint8Array> {
    try {
      const bookmark = this.bookmarks.get(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }

      // Update bookmark properties
      Object.assign(bookmark, updates);
      this.bookmarks.set(bookmarkId, bookmark);

      // Update PDF metadata
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const bookmarkData = {
        bookmarks: Array.from(this.bookmarks.values()),
        rootBookmarks: this.rootBookmarks
      };

      pdfDoc.setSubject(`BOOKMARKS:${JSON.stringify(bookmarkData)}`);

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw new Error('Failed to update bookmark');
    }
  }

  /**
   * Reorder bookmarks
   */
  async reorderBookmarks(
    pdfBytes: Uint8Array,
    parentId: string | null,
    newOrder: string[]
  ): Promise<Uint8Array> {
    try {
      if (parentId) {
        const parent = this.bookmarks.get(parentId);
        if (parent) {
          parent.children = newOrder;
        }
      } else {
        this.rootBookmarks = newOrder;
      }

      // Update PDF metadata
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const bookmarkData = {
        bookmarks: Array.from(this.bookmarks.values()),
        rootBookmarks: this.rootBookmarks
      };

      pdfDoc.setSubject(`BOOKMARKS:${JSON.stringify(bookmarkData)}`);

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error reordering bookmarks:', error);
      throw new Error('Failed to reorder bookmarks');
    }
  }

  /**
   * Generate table of contents from bookmarks
   */
  generateTableOfContents(
    bookmarks: Bookmark[],
    style: Partial<TableOfContents['style']> = {}
  ): TableOfContents {
    const tocStyle: TableOfContents['style'] = {
      fontSize: 12,
      fontFamily: 'Helvetica',
      showPageNumbers: true,
      showDots: true,
      indentSize: 20,
      ...style
    };

    const tocEntries = this.convertBookmarksToTOC(bookmarks);

    return {
      title: 'Table of Contents',
      entries: tocEntries,
      style: tocStyle
    };
  }

  /**
   * Add table of contents page to PDF
   */
  async addTableOfContentsPage(
    pdfBytes: Uint8Array,
    toc: TableOfContents,
    insertAt: number = 1
  ): Promise<Uint8Array> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      
      // Create new page for TOC
      const page = pdfDoc.insertPage(insertAt - 1);
      const { width, height } = page.getSize();
      
      const font = await pdfDoc.embedFont('Helvetica' as any);
      const boldFont = await pdfDoc.embedFont('Helvetica-Bold' as any);
      
      let y = height - 50;
      const margin = 50;
      const maxWidth = width - 2 * margin;
      
      // Draw title
      page.drawText(toc.title, {
        x: margin,
        y,
        size: toc.style.fontSize + 6,
        font: boldFont,
        color: rgb(0, 0, 0)
      });
      
      y -= toc.style.fontSize + 20;
      
      // Draw TOC entries
      for (const entry of toc.entries) {
        y = this.drawTOCEntry(page, entry, margin, y, toc.style, font, maxWidth);
        if (y < 50) {
          // Add new page if needed
          const newPage = pdfDoc.addPage();
          page = newPage;
          y = height - 50;
        }
      }
      
      return await pdfDoc.save();
    } catch (error) {
      console.error('Error adding table of contents:', error);
      throw new Error('Failed to add table of contents');
    }
  }

  /**
   * Generate outline from document structure
   */
  async generateOutlineFromContent(
    pdfBytes: Uint8Array,
    options: {
      detectHeadings?: boolean;
      headingPatterns?: RegExp[];
      maxLevels?: number;
    } = {}
  ): Promise<OutlineNode[]> {
    try {
      // This would require text extraction and analysis
      // For now, return basic structure
      const {
        detectHeadings = true,
        headingPatterns = [
          /^Chapter\s+\d+/i,
          /^Section\s+\d+/i,
          /^\d+\.\s+/,
          /^[A-Z][^.]*$/
        ],
        maxLevels = 5
      } = options;

      // In a full implementation, this would:
      // 1. Extract text from each page
      // 2. Analyze text for heading patterns
      // 3. Determine heading hierarchy
      // 4. Create outline structure

      console.warn('Outline generation from content requires text analysis - returning sample structure');
      
      return [
        {
          title: 'Introduction',
          level: 1,
          pageNumber: 1,
          children: [],
          isExpanded: true
        },
        {
          title: 'Chapter 1',
          level: 1,
          pageNumber: 3,
          children: [
            {
              title: 'Section 1.1',
              level: 2,
              pageNumber: 4,
              children: [],
              isExpanded: false
            }
          ],
          isExpanded: true
        }
      ];
    } catch (error) {
      console.error('Error generating outline:', error);
      return [];
    }
  }

  /**
   * Convert outline to bookmarks
   */
  async convertOutlineToBookmarks(
    pdfBytes: Uint8Array,
    outline: OutlineNode[]
  ): Promise<Uint8Array> {
    try {
      let updatedPdf = pdfBytes;

      for (const node of outline) {
        const result = await this.addBookmark(updatedPdf, {
          title: node.title,
          pageNumber: node.pageNumber,
          level: node.level,
          x: node.x,
          y: node.y,
          isOpen: node.isExpanded,
          action: {
            type: 'goto',
            destination: {
              pageNumber: node.pageNumber,
              x: node.x,
              y: node.y
            }
          }
        });

        updatedPdf = result.pdfBytes;

        // Recursively add children
        if (node.children.length > 0) {
          updatedPdf = await this.convertOutlineToBookmarks(updatedPdf, node.children);
        }
      }

      return updatedPdf;
    } catch (error) {
      console.error('Error converting outline to bookmarks:', error);
      throw new Error('Failed to convert outline to bookmarks');
    }
  }

  /**
   * Navigation history management
   */
  addToHistory(navigation: {
    pageNumber: number;
    x?: number;
    y?: number;
    zoom?: number;
    title?: string;
  }): void {
    // Remove any items after current position (when navigating after going back)
    this.navigationHistory.items = this.navigationHistory.items.slice(0, this.navigationHistory.current + 1);
    
    // Add new item
    this.navigationHistory.items.push({
      ...navigation,
      timestamp: new Date()
    });
    
    this.navigationHistory.current = this.navigationHistory.items.length - 1;
    
    // Limit history size
    const maxHistorySize = 100;
    if (this.navigationHistory.items.length > maxHistorySize) {
      this.navigationHistory.items = this.navigationHistory.items.slice(-maxHistorySize);
      this.navigationHistory.current = this.navigationHistory.items.length - 1;
    }
  }

  goBack(): NavigationHistory['items'][0] | null {
    if (this.navigationHistory.current > 0) {
      this.navigationHistory.current--;
      return this.navigationHistory.items[this.navigationHistory.current];
    }
    return null;
  }

  goForward(): NavigationHistory['items'][0] | null {
    if (this.navigationHistory.current < this.navigationHistory.items.length - 1) {
      this.navigationHistory.current++;
      return this.navigationHistory.items[this.navigationHistory.current];
    }
    return null;
  }

  canGoBack(): boolean {
    return this.navigationHistory.current > 0;
  }

  canGoForward(): boolean {
    return this.navigationHistory.current < this.navigationHistory.items.length - 1;
  }

  getNavigationHistory(): NavigationHistory {
    return { ...this.navigationHistory };
  }

  /**
   * Search bookmarks
   */
  searchBookmarks(query: string): Bookmark[] {
    const results: Bookmark[] = [];
    const lowercaseQuery = query.toLowerCase();

    for (const bookmark of this.bookmarks.values()) {
      if (bookmark.title.toLowerCase().includes(lowercaseQuery)) {
        results.push(bookmark);
      }
    }

    return results;
  }

  /**
   * Export bookmarks to various formats
   */
  exportBookmarks(format: 'json' | 'xml' | 'html' = 'json'): string {
    const bookmarkArray = Array.from(this.bookmarks.values());

    switch (format) {
      case 'json':
        return JSON.stringify({
          bookmarks: bookmarkArray,
          rootBookmarks: this.rootBookmarks
        }, null, 2);

      case 'xml':
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<bookmarks>\n';
        for (const bookmark of bookmarkArray) {
          xml += this.bookmarkToXml(bookmark, 1);
        }
        xml += '</bookmarks>';
        return xml;

      case 'html':
        let html = '<html><head><title>Bookmarks</title></head><body>\n<h1>Bookmarks</h1>\n<ul>\n';
        for (const rootId of this.rootBookmarks) {
          const bookmark = this.bookmarks.get(rootId);
          if (bookmark) {
            html += this.bookmarkToHtml(bookmark, 1);
          }
        }
        html += '</ul>\n</body></html>';
        return html;

      default:
        return this.exportBookmarks('json');
    }
  }

  /**
   * Import bookmarks from various formats
   */
  async importBookmarks(
    pdfBytes: Uint8Array,
    data: string,
    format: 'json' | 'xml' = 'json'
  ): Promise<Uint8Array> {
    try {
      let bookmarkData: any;

      switch (format) {
        case 'json':
          bookmarkData = JSON.parse(data);
          break;
        case 'xml':
          // Simple XML parsing - in production, use proper XML parser
          console.warn('XML import not fully implemented');
          return pdfBytes;
      }

      // Clear existing bookmarks
      this.bookmarks.clear();
      this.rootBookmarks = [];

      // Import new bookmarks
      if (bookmarkData.bookmarks) {
        for (const bookmark of bookmarkData.bookmarks) {
          this.bookmarks.set(bookmark.id, bookmark);
        }
      }

      if (bookmarkData.rootBookmarks) {
        this.rootBookmarks = bookmarkData.rootBookmarks;
      }

      // Update PDF
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.setSubject(`BOOKMARKS:${JSON.stringify({
        bookmarks: Array.from(this.bookmarks.values()),
        rootBookmarks: this.rootBookmarks
      })}`);

      return await pdfDoc.save();
    } catch (error) {
      console.error('Error importing bookmarks:', error);
      throw new Error('Failed to import bookmarks');
    }
  }

  // Helper methods

  private generateId(): string {
    return 'bookmark_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private removeBookmarkRecursively(bookmarkId: string): void {
    const bookmark = this.bookmarks.get(bookmarkId);
    if (bookmark) {
      // Remove children first
      for (const childId of bookmark.children) {
        this.removeBookmarkRecursively(childId);
      }
      // Remove the bookmark itself
      this.bookmarks.delete(bookmarkId);
    }
  }

  private convertBookmarksToTOC(bookmarks: Bookmark[]): TOCEntry[] {
    return bookmarks.map(bookmark => ({
      title: bookmark.title,
      pageNumber: bookmark.pageNumber,
      level: bookmark.level,
      children: bookmark.children
        .map(childId => this.bookmarks.get(childId))
        .filter(child => child !== undefined)
        .map(child => this.convertBookmarksToTOC([child!])[0])
    }));
  }

  private drawTOCEntry(
    page: any,
    entry: TOCEntry,
    margin: number,
    y: number,
    style: TableOfContents['style'],
    font: any,
    maxWidth: number
  ): number {
    const indent = margin + (entry.level - 1) * style.indentSize;
    const pageNumText = entry.pageNumber.toString();
    const pageNumWidth = font.widthOfTextAtSize(pageNumText, style.fontSize);

    // Draw title
    page.drawText(entry.title, {
      x: indent,
      y,
      size: style.fontSize,
      font,
      color: rgb(0, 0, 0)
    });

    if (style.showPageNumbers) {
      // Draw page number
      page.drawText(pageNumText, {
        x: margin + maxWidth - pageNumWidth,
        y,
        size: style.fontSize,
        font,
        color: rgb(0, 0, 0)
      });

      // Draw dots if enabled
      if (style.showDots) {
        const titleWidth = font.widthOfTextAtSize(entry.title, style.fontSize);
        const dotAreaStart = indent + titleWidth + 10;
        const dotAreaEnd = margin + maxWidth - pageNumWidth - 10;
        const dotSpacing = 4;

        for (let x = dotAreaStart; x < dotAreaEnd; x += dotSpacing) {
          page.drawText('.', {
            x,
            y,
            size: style.fontSize,
            font,
            color: rgb(0.5, 0.5, 0.5)
          });
        }
      }
    }

    y -= style.fontSize + 4;

    // Draw children
    for (const child of entry.children) {
      y = this.drawTOCEntry(page, child, margin, y, style, font, maxWidth);
    }

    return y;
  }

  private bookmarkToXml(bookmark: Bookmark, level: number): string {
    const indent = '  '.repeat(level);
    let xml = `${indent}<bookmark id="${bookmark.id}" level="${bookmark.level}" page="${bookmark.pageNumber}">\n`;
    xml += `${indent}  <title><![CDATA[${bookmark.title}]]></title>\n`;
    
    if (bookmark.children.length > 0) {
      xml += `${indent}  <children>\n`;
      for (const childId of bookmark.children) {
        const child = this.bookmarks.get(childId);
        if (child) {
          xml += this.bookmarkToXml(child, level + 2);
        }
      }
      xml += `${indent}  </children>\n`;
    }
    
    xml += `${indent}</bookmark>\n`;
    return xml;
  }

  private bookmarkToHtml(bookmark: Bookmark, level: number): string {
    let html = `<li><a href="#page${bookmark.pageNumber}">${bookmark.title}</a> (Page ${bookmark.pageNumber})`;
    
    if (bookmark.children.length > 0) {
      html += '\n<ul>\n';
      for (const childId of bookmark.children) {
        const child = this.bookmarks.get(childId);
        if (child) {
          html += this.bookmarkToHtml(child, level + 1);
        }
      }
      html += '</ul>\n';
    }
    
    html += '</li>\n';
    return html;
  }

  /**
   * Get all bookmarks in tree structure
   */
  getBookmarkTree(): Bookmark[] {
    return this.rootBookmarks
      .map(id => this.bookmarks.get(id))
      .filter(bookmark => bookmark !== undefined) as Bookmark[];
  }

  /**
   * Get bookmark by ID
   */
  getBookmark(id: string): Bookmark | undefined {
    return this.bookmarks.get(id);
  }

  /**
   * Get all bookmarks as flat array
   */
  getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values());
  }
}

export default BookmarkService;