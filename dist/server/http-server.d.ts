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
declare const app: import("express-serve-static-core").Express;
export default app;
//# sourceMappingURL=http-server.d.ts.map