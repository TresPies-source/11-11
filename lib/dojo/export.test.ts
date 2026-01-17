import { generateDefaultFilename } from './export';

describe('Export Utilities', () => {
  describe('generateDefaultFilename', () => {
    it('should generate filename with sanitized title and date', () => {
      const filename = generateDefaultFilename('Test Session');
      expect(filename).toMatch(/^test-session-\d{4}-\d{2}-\d{2}\.md$/);
    });

    it('should handle special characters in title', () => {
      const filename = generateDefaultFilename('Test @ Session #1!');
      expect(filename).toMatch(/^test-session-1-\d{4}-\d{2}-\d{2}\.md$/);
    });

    it('should use default title when undefined', () => {
      const filename = generateDefaultFilename();
      expect(filename).toMatch(/^session-\d{4}-\d{2}-\d{2}\.md$/);
    });

    it('should handle empty string', () => {
      const filename = generateDefaultFilename('');
      expect(filename).toMatch(/^session-\d{4}-\d{2}-\d{2}\.md$/);
    });

    it('should handle multiple consecutive special chars', () => {
      const filename = generateDefaultFilename('Test:::Session');
      expect(filename).toMatch(/^test-session-\d{4}-\d{2}-\d{2}\.md$/);
    });
  });
});
