# AI Execution Guide — Professional PDF Editor (Agent‑Ready)

> Purpose: Enable an autonomous or semi‑autonomous AI agent to **safely operate** the Electron‑based PDF Editor end‑to‑end. This guide encodes capabilities, preconditions, schemas, guardrails, and playbooks so the agent can plan, act, and verify without human prompting.

---

## 0) Quickstart (Agent Loop)

**Goal → Plan → Guardrails → Act → Verify → Persist**

1. **Load Context**: read `ARCHITECTURE.md`, `API.md`, `SECURITY.md`, and `DEVELOPMENT.md` indices if unknown; cache capability map (section 3).
2. **Define Intent**: translate user request into one or more **Playbooks** (section 6). If multi‑step, produce a DAG of actions with dependencies.
3. **Run Gate Checks**: apply **Global Guardrails** (section 2) + **Operation Preconditions** for each step.
4. **Execute**: call tools/services via the **Action Schemas** (section 4). Use smallest possible scope.
5. **Verify**: validate outputs with **Success Criteria** and **Postconditions**. If failed → run **Recovery/Retry** (section 7).
6. **Persist**: save artifacts, update recents/preferences, emit logs/metrics (section 8).

---

## 1) Agent Responsibilities & Non‑Goals

**Responsibilities**

- Follow security defaults (sandbox, context isolation, strict IPC) at all times.
- Prefer idempotent, reversible actions; ask for explicit confirmation before **destructive** ops (e.g., redact, overwrite, encrypt with unknown password strength).
- Emit structured logs and user‑friendly summaries.
- Keep state minimal; store only what is necessary for rollback.

**Non‑Goals**

- Do **not** circumvent platform security (no direct Node APIs in renderer, no unvetted remote resources, no deprecated `remote` module).
- Do **not** exceed performance budgets (section 8) or file size caps.

---

## 2) Global Guardrails (Always Apply)

- **Security**: contextIsolation = true; nodeIntegration = false; sandbox = true; enforce CSP; limited `contextBridge` surface.
- **Allowed File Types**: primarily `.pdf`; optional text/image imports must be sanitized.
- **Path Safety**: disallow path traversal; only operate within user-selected files.
- **Size Limits**: reject or chunk inputs **> 100 MB** unless playbook explicitly allows and system resources are sufficient.
- **Privacy**: never transmit documents externally; no telemetry contains sensitive content.
- **Passwords & Keys**: enforce strong password policy when encrypting; never log secrets.

---

## 3) Capability Map (High‑Level)

**Core Services**

- **PDFService**: load, save, merge, split, compress, rotate, metadata, extract text.
- **AnnotationService**: create/update/delete annotations; import/export; apply to PDF.
- **OCRService**: initialize; perform page‑level OCR; create searchable PDFs.
- **SecurityService**: encrypt/decrypt; add/verify digital signatures; set permissions.
- **SearchService**: initialize; search; navigate results; highlight/clear; stats.

**System/IPC**

- File dialogs (`open-file-dialog`, `save-file-dialog`), file save, recent files, preferences.

---

## 4) Action Schemas (Canonical Interfaces)

All actions follow this envelope:

```json
{
  "action": "<namespace.method>",
  "args": { "...": "..." },
  "expect": { "shape": "<type>", "invariants": ["..."] },
  "on_error": { "retry": { "times": 2, "backoff_ms": 250 }, "fallback": "<action?>" }
}
```

Binary data MUST be **base64** unless explicitly noted.

### 4.1 File/IPC

**open.dialog**

```json
{
  "action": "ipc.open.dialog",
  "args": {
    "title": "Select PDF",
    "filters": [{ "name": "PDF", "extensions": ["pdf"] }],
    "properties": ["openFile"]
  },
  "expect": { "shape": { "canceled": "boolean", "filePaths": ["string"] }, "invariants": ["!canceled implies filePaths[0] exists"] }
}
```

**save.dialog**

```json
{
  "action": "ipc.save.dialog",
  "args": { "title": "Save PDF", "defaultPath": "document.pdf", "filters": [{"name":"PDF","extensions":["pdf"]}] },
  "expect": { "shape": { "canceled": "boolean", "filePath": "string|null" } }
}
```

**file.save**

```json
{
  "action": "ipc.file.save",
  "args": { "path": "string", "data_b64": "string" },
  "expect": { "shape": { "success": "boolean" }, "invariants": ["path endsWith .pdf", "data_b64 decodes"] }
}
```

**recents.add** / **recents.get**, **prefs.get** / **prefs.set**: use small JSON blobs; avoid secrets.

### 4.2 PDFService

**pdf.load**

```json
{
  "action": "pdf.load",
  "args": { "source": { "kind": "path|b64", "value": "..." } },
  "expect": { "shape": { "numPages": "number", "docId": "string" }, "invariants": ["numPages >= 1"] }
}
```

**pdf.save**

```json
{
  "action": "pdf.save",
  "args": { "docId": "string", "options": { "optimize": true } },
  "expect": { "shape": { "data_b64": "string", "bytes": "number" } }
}
```

**pdf.merge**

```json
{
  "action": "pdf.merge",
  "args": { "pdfs_b64": ["string"], "options": { "insertBookmarks": true, "preserveFormFields": true } },
  "expect": { "shape": { "data_b64": "string" }, "invariants": ["result is valid PDF"] }
}
```

**pdf.split**

```json
{
  "action": "pdf.split",
  "args": { "pdf_b64": "string", "ranges": [{ "from": 1, "to": 3 }] },
  "expect": { "shape": { "parts_b64": ["string"] }, "invariants": ["parts_b64.length >= 1"] }
}
```

**pdf.compress**

```json
{
  "action": "pdf.compress",
  "args": { "pdf_b64": "string", "quality": "low|medium|high" },
  "expect": { "shape": { "data_b64": "string" }, "invariants": ["size(result) <= size(input)"] }
}
```

**pdf.rotate**

```json
{
  "action": "pdf.rotate",
  "args": { "pdf_b64": "string", "page": 2, "degrees": 90 },
  "expect": { "shape": { "data_b64": "string" } }
}
```

**pdf.metadata.get / pdf.metadata.set** — standard key/value fields; setting returns full updated metadata.

### 4.3 AnnotationService

**anno.create**

```json
{
  "action": "anno.create",
  "args": { "type": "highlight|text|shape|ink", "page": 1, "position": { "x": 100, "y": 200 }, "options": { "color": "#FFFF00", "opacity": 0.5, "bounds": { "width": 200, "height": 20 } } },
  "expect": { "shape": { "id": "string" } }
}
```

**anno.update / anno.delete / anno.getPage / anno.applyToPdf**

```json
{
  "action": "anno.applyToPdf",
  "args": { "pdf_b64": "string" },
  "expect": { "shape": { "data_b64": "string" } }
}
```

### 4.4 OCRService

**ocr.init**

```json
{
  "action": "ocr.init",
  "args": { "languages": ["eng", "deu"], "workerPath": "./workers/" },
  "expect": { "shape": { "ready": "boolean" }, "invariants": ["ready === true"] }
}
```

**ocr.page**

```json
{
  "action": "ocr.page",
  "args": { "pdfDocId": "string", "page": 1, "granularity": "word|line", "includeConfidence": true },
  "expect": { "shape": { "text": "string", "confidence": "number" }, "invariants": ["0 <= confidence <= 100"] }
}
```

**ocr.makeSearchable**

```json
{
  "action": "ocr.makeSearchable",
  "args": { "pdf_b64": "string", "options": { "languages": ["eng"], "embedTextLayer": true } },
  "expect": { "shape": { "data_b64": "string" } }
}
```

### 4.5 SecurityService

**sec.encrypt**

```json
{
  "action": "sec.encrypt",
  "args": {
    "pdf_b64": "string",
    "password": "string",
    "options": {
      "algorithm": "AES-256",
      "permissions": {
        "printing": "highResolution",
        "modifying": false,
        "copying": false,
        "annotating": true,
        "fillingForms": true
      }
    }
  },
  "expect": { "shape": { "success": "boolean", "data_b64": "string|null", "error": "string|null" }, "invariants": ["success implies data_b64 present"] }
}
```

**sec.decrypt** — supply password; expect decrypted `data_b64` or error.

**sec.sign**

```json
{
  "action": "sec.sign",
  "args": { "pdf_b64": "string", "signature": { "certificate_b64": "string", "reason": "string", "location": "string", "contactInfo": "string" } },
  "expect": { "shape": { "data_b64": "string" } }
}
```

**sec.verify**

```json
{
  "action": "sec.verify",
  "args": { "pdf_b64": "string" },
  "expect": { "shape": { "verifications": [{ "valid": "boolean", "reason": "string|null" }] }, "invariants": ["verifications.length >= 1"] }
}
```

### 4.6 SearchService

**search.init**

```json
{
  "action": "search.init",
  "args": { "pdfDocId": "string" },
  "expect": { "shape": { "ready": "boolean" } }
}
```

**search.query**

```json
{
  "action": "search.query",
  "args": { "query": "invoice", "options": { "caseSensitive": false, "wholeWord": true, "regex": false, "searchAllPages": true } },
  "expect": { "shape": { "results": [{ "page": "number", "text": "string" }] } }
}
```

---

## 5) Preconditions & Postconditions (Per Service)

**Common Preconditions**

- Input is present, typed correctly, and within size limits.
- For **OCR**: languages initialized (`ocr.init`) before `ocr.page` or `ocr.makeSearchable`.
- For **Security**: enforce strong password policy; never pass raw private keys in plaintext; avoid logging secrets.

**Common Postconditions**

- Outputs pass PDF validity checks (magic bytes `%PDF-` and parsable trailer) when applicable.
- Side effects (recents/preferences) updated only on success.

---

## 6) Playbooks (End‑to‑End Flows)

### 6.1 Open → Annotate → Save

1. `ipc.open.dialog` → select file.
2. `pdf.load` → assert `numPages >= 1`.
3. `anno.create` (repeat as needed) → `anno.applyToPdf`.
4. `ipc.save.dialog` → confirm destination path.
5. `ipc.file.save` with `data_b64` from `anno.applyToPdf`.
6. `recents.add` → log success.

**Success Criteria**: saved file exists, re‑`pdf.load` succeeds, annotations present on expected pages.

### 6.2 OCR: Make Searchable PDF

1. `ocr.init` (languages, worker path).
2. `pdf.load` (scanned doc) → basic text extraction returns empty/low.
3. `ocr.makeSearchable`.
4. `ipc.save.dialog` → `ipc.file.save`.

**Success Criteria**: `search.init` + `search.query` returns matches for sampled words.

### 6.3 Redaction (Destructive)

1. Build redaction list from search or user marks.
2. Confirm with user (explicit). Snapshot original.
3. Apply redactions (tooling as provided), then `pdf.save`.
4. Verify removed content is **not** retrievable via text extraction or copy.

### 6.4 Sign & Verify

1. Load PDF; collect signature info (reason/location/contact).
2. `sec.sign` with certificate; keep original copy.
3. `sec.verify` → all signatures valid.
4. Save.

### 6.5 Encrypt & Share

1. Enforce strong password policy.
2. `sec.encrypt` with permissions.
3. Save; then attempt open+decrypt path to ensure correctness.

### 6.6 Merge/Split/Compress

- **Merge**: `pdf.merge` → save → reload & verify pages.
- **Split**: `pdf.split` with explicit ranges → save parts.
- **Compress**: `pdf.compress` with budget (target size/quality) → verify readability and metadata preserved.

---

## 7) Errors, Recovery, and Retries

**Categories**: ValidationError, PermissionError, FileTooLarge, UnsupportedFormat, OCREngineUnavailable, SignatureInvalid, EncryptionFailed.

**Policy**

- Validate early; **fail fast** with actionable messages.
- Retries: network‑independent local ops rarely benefit; prefer **diagnose → fix input → retry once**.
- Recovery: keep original copies; never overwrite without explicit confirmation.

**Diagnostic Aids**

- Include `docId`, action name, and minimal stack where safe.

---

## 8) Performance Budgets & Concurrency

- UI responsiveness target: main thread unblock within 16 ms slice.
- Prefer chunked operations for > 50 MB PDFs; stream when possible.
- OCR concurrency: cap workers to available cores − 1; throttle I/O.
- Avoid multiple simultaneous writes; serialize `ipc.file.save`.

---

## 9) Logging & Telemetry (Privacy‑Preserving)

**Event shape**

```json
{
  "time": "ISO8601",
  "actor": "ai-agent",
  "action": "pdf.merge",
  "status": "ok|error",
  "latency_ms": 1234,
  "doc": { "pages": 24, "bytes": 1048576 },
  "notes": "no PII; summarize only"
}
```

Do **not** log file paths, text content, passwords, or certificate material.

---

## 10) State Model

- **Transient**: `docId`, open dialogs, in‑memory buffers, OCR progress.
- **Persistent**: recents (paths only with user consent), preferences (theme, language), last window state.
- **Derived**: search indexes, annotations prior to apply.

---

## 11) Security Checklist (Per Operation)

- Electron security flags enforced (contextIsolation, sandbox, no Node in renderer).
- IPC calls only via whitelisted channels; validate origin and input types.
- CSP active; no external scripts/styles unless whitelisted.
- For encryption/signing: strong password policy; certificates handled securely.
- Sanitization for any user string inputs (filenames, annotation text).

---

## 12) Worked Examples (Copy‑Paste Ready)

### Example: Merge and Save

```json
[
  { "action": "pdf.merge", "args": { "pdfs_b64": ["<b64_A>", "<b64_B>"] } },
  { "action": "ipc.save.dialog", "args": { "title": "Save merged" } },
  { "action": "ipc.file.save", "args": { "path": "<from_dialog>", "data_b64": "<from_merge>" } }
]
```

### Example: OCR Page 1 and Search

```json
[
  { "action": "ocr.init", "args": { "languages": ["eng"], "workerPath": "./workers/" } },
  { "action": "pdf.load", "args": { "source": { "kind": "b64", "value": "<b64>" } } },
  { "action": "ocr.page", "args": { "pdfDocId": "<from_load>", "page": 1, "granularity": "word", "includeConfidence": true } },
  { "action": "search.init", "args": { "pdfDocId": "<from_load>" } },
  { "action": "search.query", "args": { "query": "Total", "options": { "wholeWord": true } } }
]
```

### Example: Encrypt and Verify Round‑Trip

```json
[
  { "action": "sec.encrypt", "args": { "pdf_b64": "<b64>", "password": "S3cure!Pass", "options": { "algorithm": "AES-256", "permissions": { "printing": "highResolution", "modifying": false, "copying": false, "annotating": true, "fillingForms": true } } } },
  { "action": "ipc.save.dialog", "args": { "title": "Save encrypted" } },
  { "action": "ipc.file.save", "args": { "path": "<from_dialog>", "data_b64": "<from_encrypt>" } },
  { "action": "sec.decrypt", "args": { "pdf_b64": "<from_encrypt>", "password": "S3cure!Pass" } }
]
```

---

## 13) Appendix: JSON Types (Abbreviated)

```json
{
  "PDFDocumentInfo": { "docId": "string", "numPages": "number" },
  "Annotation": { "id": "string", "type": "string", "page": "number", "position": {"x":"number","y":"number"}, "options": "object" },
  "SearchResult": { "page": "number", "text": "string", "bbox": ["number","number","number","number"] }
}
```

---

### Final Notes for Agents

- Prefer **small, verifiable steps**. After each action, confirm invariants before proceeding.
- Avoid destructive actions unless explicitly requested; always keep a restorable copy.
- If any guardrail would be violated, **stop and ask** for human confirmation.

