import type { ExtractedTextResult } from '../types';
/**
 * Extract text from a PDF or image buffer.
 * 1. Tries embedded PDF text (via pdf-parse).
 * 2. Falls back to OCR (tesseract.js) if embedded text is empty / too short.
 *
 * Returns an ExtractedTextResult with the normalised text and metadata.
 */
export declare function extractText(buffer: Buffer, mimeType: string): Promise<ExtractedTextResult>;
//# sourceMappingURL=text-extractor.d.ts.map