"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractText = extractText;
// ---------------------------------------------------------------------------
// Embedded PDF text extraction (Node.js — pdf-parse)
// ---------------------------------------------------------------------------
async function extractEmbeddedPdfText(buffer) {
    // Dynamic import so the module can be replaced or mocked easily
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
}
// ---------------------------------------------------------------------------
// OCR fallback (tesseract.js)
// ---------------------------------------------------------------------------
async function extractTextWithOcr(buffer) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Tesseract = require('tesseract.js');
    const { data } = await Tesseract.recognize(buffer, 'spa', {
        logger: () => undefined,
    });
    return { text: data.text, confidence: data.confidence / 100 };
}
// ---------------------------------------------------------------------------
// Text normalisation helpers
// ---------------------------------------------------------------------------
function normalizeText(raw) {
    return raw
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[ \t]+/g, ' ') // collapse horizontal whitespace
        .replace(/\n{3,}/g, '\n\n') // collapse excessive blank lines
        .trim();
}
/** Minimum "useful" character count to consider embedded text valid */
const MIN_EMBEDDED_CHARS = 100;
function isTextUseful(text) {
    const stripped = text.replace(/\s/g, '');
    return stripped.length >= MIN_EMBEDDED_CHARS;
}
// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
/**
 * Extract text from a PDF or image buffer.
 * 1. Tries embedded PDF text (via pdf-parse).
 * 2. Falls back to OCR (tesseract.js) if embedded text is empty / too short.
 *
 * Returns an ExtractedTextResult with the normalised text and metadata.
 */
async function extractText(buffer, mimeType) {
    const isPdf = mimeType === 'application/pdf';
    if (isPdf) {
        try {
            const embeddedText = await extractEmbeddedPdfText(buffer);
            const normalised = normalizeText(embeddedText);
            if (isTextUseful(normalised)) {
                return {
                    raw_text: normalised,
                    method: 'embedded',
                    confidence: 1.0,
                };
            }
        }
        catch {
            // pdf-parse failed — fall through to OCR
        }
    }
    // Image or PDF with no useful embedded text → OCR
    const { text, confidence } = await extractTextWithOcr(buffer);
    const normalised = normalizeText(text);
    return {
        raw_text: normalised,
        method: 'ocr',
        confidence,
    };
}
//# sourceMappingURL=text-extractor.js.map