const { AnnotationService } = require('../../src/renderer/services/AnnotationService');

// Mock pdf-lib
jest.mock('pdf-lib', () => ({
  PDFDocument: {
    load: jest.fn()
  },
  rgb: jest.fn(),
  StandardFonts: {
    Helvetica: 'Helvetica',
    HelveticaBold: 'HelveticaBold'
  },
  degrees: jest.fn()
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid')
}));

describe('AnnotationService', () => {
  let annotationService;
  
  beforeEach(() => {
    annotationService = new AnnotationService();
    jest.clearAllMocks();
  });

  describe('createAnnotation', () => {
    it('should create a new annotation with default properties', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200, {
        text: 'Test annotation'
      });
      
      expect(annotation).toEqual({
        id: 'mock-uuid',
        type: 'text',
        pageIndex: 0,
        x: 100,
        y: 200,
        text: 'Test annotation',
        createdAt: expect.any(Date),
        modifiedAt: expect.any(Date)
      });
    });

    it('should store the annotation', () => {
      const annotation = annotationService.createAnnotation('highlight', 1, 50, 75);
      const stored = annotationService.getAllAnnotations();
      
      expect(stored).toHaveLength(1);
      expect(stored[0]).toEqual(annotation);
    });
  });

  describe('getPageAnnotations', () => {
    it('should return annotations for a specific page', () => {
      annotationService.createAnnotation('text', 0, 100, 200, { text: 'Page 0 annotation' });
      annotationService.createAnnotation('highlight', 1, 50, 75);
      annotationService.createAnnotation('text', 0, 150, 250, { text: 'Another page 0 annotation' });
      
      const page0Annotations = annotationService.getPageAnnotations(0);
      const page1Annotations = annotationService.getPageAnnotations(1);
      
      expect(page0Annotations).toHaveLength(2);
      expect(page1Annotations).toHaveLength(1);
      expect(page0Annotations[0].text).toBe('Page 0 annotation');
      expect(page0Annotations[1].text).toBe('Another page 0 annotation');
      expect(page1Annotations[0].type).toBe('highlight');
    });

    it('should not return hidden annotations', () => {
      annotationService.createAnnotation('text', 0, 100, 200, { text: 'Visible annotation' });
      const hiddenAnnotation = annotationService.createAnnotation('highlight', 0, 50, 75);
      annotationService.updateAnnotation(hiddenAnnotation.id, { isHidden: true });
      
      const annotations = annotationService.getPageAnnotations(0);
      
      expect(annotations).toHaveLength(1);
      expect(annotations[0].text).toBe('Visible annotation');
    });
  });

  describe('updateAnnotation', () => {
    it('should update an existing annotation', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200, { text: 'Original text' });
      
      const updated = annotationService.updateAnnotation(annotation.id, {
        text: 'Updated text',
        x: 150
      });
      
      expect(updated).toEqual({
        ...annotation,
        text: 'Updated text',
        x: 150,
        modifiedAt: expect.any(Date)
      });
      
      const stored = annotationService.getAllAnnotations()[0];
      expect(stored.text).toBe('Updated text');
      expect(stored.x).toBe(150);
    });

    it('should not update a locked annotation', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200, { text: 'Locked annotation' });
      annotationService.updateAnnotation(annotation.id, { isLocked: true });
      
      const updated = annotationService.updateAnnotation(annotation.id, { text: 'Should not update' });
      
      expect(updated).toBeNull();
      expect(annotationService.getAllAnnotations()[0].text).toBe('Original text');
    });

    it('should return null for non-existent annotation', () => {
      const updated = annotationService.updateAnnotation('non-existent-id', { text: 'New text' });
      
      expect(updated).toBeNull();
    });
  });

  describe('deleteAnnotation', () => {
    it('should delete an existing annotation', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200);
      
      const deleted = annotationService.deleteAnnotation(annotation.id);
      
      expect(deleted).toBe(true);
      expect(annotationService.getAllAnnotations()).toHaveLength(0);
    });

    it('should not delete a locked annotation', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200);
      annotationService.updateAnnotation(annotation.id, { isLocked: true });
      
      const deleted = annotationService.deleteAnnotation(annotation.id);
      
      expect(deleted).toBe(false);
      expect(annotationService.getAllAnnotations()).toHaveLength(1);
    });

    it('should return false for non-existent annotation', () => {
      const deleted = annotationService.deleteAnnotation('non-existent-id');
      
      expect(deleted).toBe(false);
    });
  });

  describe('searchAnnotations', () => {
    it('should find annotations containing the search query', () => {
      annotationService.createAnnotation('text', 0, 100, 200, { text: 'This is a test annotation' });
      annotationService.createAnnotation('note', 1, 50, 75, { text: 'Another annotation' });
      annotationService.createAnnotation('highlight', 0, 25, 30);
      
      const results = annotationService.searchAnnotations('test');
      
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('This is a test annotation');
    });

    it('should search in annotation replies', () => {
      const annotation = annotationService.createAnnotation('text', 0, 100, 200, { text: 'Original text' });
      annotationService.addReply(annotation.id, 'This is a reply with test content', 'Author');
      
      const results = annotationService.searchAnnotations('test');
      
      expect(results).toHaveLength(1);
      expect(results[0].text).toBe('Original text');
    });
  });

  describe('getStatistics', () => {
    it('should return annotation statistics', () => {
      annotationService.createAnnotation('text', 0, 100, 200, { text: 'Text annotation' });
      annotationService.createAnnotation('highlight', 0, 50, 75);
      annotationService.createAnnotation('text', 1, 150, 250, { text: 'Another text annotation' });
      annotationService.createAnnotation('highlight', 1, 25, 30);
      
      const stats = annotationService.getStatistics();
      
      expect(stats).toEqual({
        total: 4,
        byType: {
          text: 2,
          highlight: 2
        },
        byPage: {
          0: 2,
          1: 2
        }
      });
    });
  });
});