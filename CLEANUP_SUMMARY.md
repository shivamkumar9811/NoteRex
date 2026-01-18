# NoteRex Cleanup Summary

## Files Removed
- **None.** No files were deleted. Unused code (debug `fetch` calls, `parseFormData`/Busboy, Firebase/notes in `[[...path]]`, and unused imports) was removed in place.

---

## Files Modified

### 1. `lib/mongodb.js`
- Moved `MONGODB_URI`/`MONGO_URL` check into `connectMongo()` so the module does not throw at import when env is missing (avoids build crash).
- Wrapped top-level `MongoClient` creation in `if (uri)` so we never call `new MongoClient(undefined, options)` at load when `MONGODB_URI` is unset.

### 2. `lib/openai.js`
- Set `apiKey: process.env.OPENAI_API_KEY || 'sk-build-placeholder'` so the client does not throw when the env var is missing at build/load time.

### 3. `lib/services/agentPipeline.js`
- **revisionQA:** Extracts and includes `revisionQA` from Notes Generator and legacy `summaries.qa`; adds it to the result and to the payload sent to `/api/notes-mongodb`.
- **Empty summaries:** Throws if `summaryFormats` are all empty instead of saving `{}`.
- **Centralized agent call:** Exported `callAgent` as `callOnDemandAgent` for use from the UI (e.g. chat).

### 4. `app/api/agents/route.js`
- Removed all debug `fetch('http://127.0.0.1:7243/ingest/...')` calls (avoids `ETIMEDOUT` when that service is down).
- Kept On-Demand flow: `/chat/v1/sessions` and `/chat/v1/sessions/:id/query` as the invoke/run path.
- Notes Generator prompt: enforce JSON with `summaryFormats` and `revisionQA`; no other changes to agent wiring.
- PDF extraction: still runs when `inputType === 'pdf'` and `fileData`; text is set on `payload` before the agent runs.
- YouTube: still extracts and transcribes before any agent; transcript is set on `payload` before the chain.

### 5. `app/api/[[...path]]/route.js`
- **Scope:** Handles only `POST /api/process`. `GET` and `DELETE` return 404 (notes live in `/api/notes-mongodb`).
- **Removed:** Firebase (`db`, Firestore), `genAI`, `uuid`, `Busboy`, `Readable`, `parseFormData`.
- **Kept:** `openai`, `pdf`, `ytdl` for `/api/process` (YouTube, text, PDF, multipart).
- **PDF:** `extractTextFromPDF` rejects known “I can’t process PDFs”/capability fallback patterns.
- **Output:** `generateSummaries` and response builder now expose `summaryFormats` and `revisionQA` (in addition to legacy `summaries`) for `regenerateNotes`.

### 6. `app/api/notes-mongodb/route.js`
- **POST:** Accepts and stores `revisionQA`; migrates legacy `summaries.qa` into `revisionQA` when `revisionQA` is not provided.
- **GET:** Returns `revisionQA`; sanitizes `transcript` and `summaryFormats` arrays so “I can’t process PDFs”, “I don’t have the capability”, etc. are never returned. Empty or bad entries are filtered out.

### 7. `app/page.js`
- **fetchNotes / deleteNote:** Switched to `/api/notes-mongodb` (and `?id=` for delete).
- **saveNote:** Sends `{ title, sourceType, transcript, summaryFormats, revisionQA, userId }` to `POST /api/notes-mongodb`.
- **processFile / processText / processYouTube:** `currentResult` now includes `revisionQA`.
- **regenerateNotes:** Uses `summaryFormats` and `revisionQA` from `/api/process` and switches to the `summary` tab.
- **handleChatSubmit:** Uses `callOnDemandAgent` from `agentPipeline` instead of direct `fetch('/api/agents')`.
- **Result view:** Added Q&A tab and `TabsContent` for `revisionQA` (only when `revisionQA.length > 0`).
- Removed debug `fetch('http://127.0.0.1:7243/ingest/...')` in the YouTube result branch.

### 8. `app/dashboard/notes/page.js`
- **viewNoteDetails:** Added `revisionQA` and a Q&A tab; sanitizes `transcript` and summary items so “I can’t process PDFs” and similar strings are never shown; uses `safe()` for HTML when building the popup.
- **downloadNote:** Still uses existing fields; `summaryFormats`/`revisionQA` can be added later if needed.

---

## Errors / Behavior Addressed

| Issue | Change |
|-------|--------|
| **TypeError / ETIMEDOUT from bad imports** | Removed debug `fetch` to `127.0.0.1:7243`; dropped unused `Busboy`, `Readable`, `genAI`, Firebase, `uuid` from `[[...path]]`; deferred Mongo and OpenAI strict checks so load/build does not throw when env is missing. |
| **Agent API usage** | Kept On-Demand `/chat/v1/sessions` and `/chat/v1/sessions/:id/query`; documented as the invoke/run path; `callOnDemandAgent` in `agentPipeline` is the single entrypoint for agent calls from the app. |
| **Structured JSON from agents** | Notes Generator prompt and pipeline parsing enforce `summaryFormats` and `revisionQA`; pipeline throws if both are effectively empty. |
| **“I can’t process PDFs” / empty `{}` in notes** | `notes-mongodb` GET sanitizes `transcript` and `summaryFormats`; pipeline rejects empty summaries; dashboard and `viewNoteDetails` filter and escape before render. |
| **Output schema** | `summaryFormats: { bulletNotes, topicWise, keyTakeaways }` and `revisionQA` (Q&A array) are used in DB, API, and UI; `revisionQA` is only Q&A, no extra fields. |
| **PDF extraction** | PDF text is always extracted in `/api/agents` (and in `/api/process` for multipart) before any agent or model; fallback “I can’t process PDFs”-style text is rejected. |
| **YouTube flow** | In `/api/agents`, YouTube is extracted and transcribed first; `transcript` is set on `payload` before the agent chain so the flow is: transcript → agents → summaries. |
| **Submit during processing** | Submit/process buttons already use `disabled={processing}`; left as is. |
| **Build / deploy** | Mongo and OpenAI no longer throw at import when env is missing; `[[...path]]` only handles `/api/process` and no longer pulls in Firebase or unused deps. |

---

## Pipeline Flow (On-Demand)

1. **Input** → from file (base64), YouTube URL, or text.
2. **Extract** → In `/api/agents`: PDF text or YouTube transcript (and title/videoId) are extracted and set on `payload` before Agent 1.
3. **Merge** → Content Fusion agent (and prior agents) in the 6-step On-Demand chain.
4. **Notes** → Notes Generator agent returns JSON with `summaryFormats` and `revisionQA`.
5. **Save** → Pipeline normalizes, validates, then `POST /api/notes-mongodb`; no Firebase in this path.

---

## Quick Checks

- `npm run dev` – app should start (env still required for MongoDB, OpenAI, On-Demand at runtime).
- `npm run build` – should complete when `OPENAI_API_KEY` is set or when `lib/openai` fallback is used; Mongo is not required at build.
- Notes UI – only `summaryFormats` and `revisionQA` are shown; no “I can’t process PDFs” or raw `{}` from the API.
