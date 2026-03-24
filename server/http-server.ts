/**
 * HTTP wrapper — thin Express server exposing the core as REST endpoints.
 *
 * Endpoints:
 *   POST /process         → ProcessResult JSON
 *   POST /process/preview → partial result (no Excel, faster)
 *   POST /process/excel   → Excel Buffer
 *   GET  /health          → { ok: true, banks: [...] }
 *
 * Body: multipart/form-data with field "file" = the PDF or image.
 */

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { processExtract, previewExtract, generateExcelFromResult } from '../src/index';
import { listSupportedBanks } from '../src/parsers/registry';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3333', 10);

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, banks: listSupportedBanks() });
});

// Full pipeline → JSON result
app.post('/process', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se recibió ningún archivo (field: "file")' });
      return;
    }
    const result = await processExtract({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.json(result);
  } catch (err) {
    console.error('[/process]', err);
    res.status(500).json({ error: String(err) });
  }
});

// Preview → partial JSON (no libro diario, no Excel)
app.post('/process/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se recibió ningún archivo (field: "file")' });
      return;
    }
    const result = await previewExtract({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    res.json(result);
  } catch (err) {
    console.error('[/process/preview]', err);
    res.status(500).json({ error: String(err) });
  }
});

// Excel export
app.post('/process/excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se recibió ningún archivo (field: "file")' });
      return;
    }
    const result = await processExtract({
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });
    const excelBuf = generateExcelFromResult(result);
    const safeName = req.file.originalname.replace(/\.[^.]+$/, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_libro_diario.xlsx"`);
    res.send(excelBuf);
  } catch (err) {
    console.error('[/process/excel]', err);
    res.status(500).json({ error: String(err) });
  }
});

// ---------------------------------------------------------------------------
// Start (only for local/dev execution)
// ---------------------------------------------------------------------------

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`extractor-bancario server listening on http://localhost:${PORT}`);
    console.log(`Bancos soportados: ${listSupportedBanks().join(', ')}`);
  });
}

export default app;
