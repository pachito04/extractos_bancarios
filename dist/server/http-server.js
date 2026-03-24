"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("../src/index");
const registry_1 = require("../src/parsers/registry");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? '3333', 10);
// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Health check
app.get('/health', (_req, res) => {
    res.json({ ok: true, banks: (0, registry_1.listSupportedBanks)() });
});
// Full pipeline → JSON result
app.post('/process', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No se recibió ningún archivo (field: "file")' });
            return;
        }
        const result = await (0, index_1.processExtract)({
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
        });
        res.json(result);
    }
    catch (err) {
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
        const result = await (0, index_1.previewExtract)({
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
        });
        res.json(result);
    }
    catch (err) {
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
        const result = await (0, index_1.processExtract)({
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
        });
        const excelBuf = (0, index_1.generateExcelFromResult)(result);
        const safeName = req.file.originalname.replace(/\.[^.]+$/, '');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeName}_libro_diario.xlsx"`);
        res.send(excelBuf);
    }
    catch (err) {
        console.error('[/process/excel]', err);
        res.status(500).json({ error: String(err) });
    }
});
// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`extractor-bancario server listening on http://localhost:${PORT}`);
    console.log(`Bancos soportados: ${(0, registry_1.listSupportedBanks)().join(', ')}`);
});
exports.default = app;
//# sourceMappingURL=http-server.js.map