====================================================================
PROJECT NAME
====================================================================

Sahayak AI - Frontline Health Worker Decision-Support & Auto-Reporting System

====================================================================
PROJECT TYPE
====================================================================

MERN + JavaScript + Agentic AI, worker-facing decision-support and
auto-reporting system for community health workers (ASHA / ANM)

====================================================================
PRIMARY OBJECTIVE
====================================================================

Build a MERN + JavaScript + Agentic AI application where a frontline
health worker can:

1. log in to a personal worker account
2. record a natural-language voice note (or typed note) after each
   household visit
3. have that note automatically converted into structured, government-
   report-ready data
4. see an automatically prioritized visit list, ranked by clinical
   risk/urgency, not by memory
5. view an auto-generated, exportable report per household
6. have high-risk cases automatically escalated to a supervisor
7. (supervisor role) view a consolidated dashboard of all escalated
   cases across every worker under them

IMPORTANT:
This is NOT a patient-facing chatbot. This is NOT a diagnostic tool.

This IS:
- a worker-facing workload-reduction and prioritization system
- voice-note ingestion + structured extraction + risk scoring
- a 5-stage agentic pipeline
- grounded, auditable outputs (no invented clinical facts)
- free / local AI only
- offline / fallback capable
- built for a low-literacy, low-bandwidth, formal institutional context

====================================================================
PROBLEM STATEMENT (GROUND TRUTH - DO NOT DEVIATE)
====================================================================

India's ~980,000 ASHA and ANM frontline health workers operate under
severe, documented understaffing - in some areas functioning at
roughly 20% of sanctioned capacity - while being responsible for
maternal care, child nutrition, immunization tracking, and infectious
disease monitoring across hundreds of households. Existing
digitization efforts require manual, structured data entry after
every visit, adding administrative burden without offering any
decision support in return. As a result, these workers are forced to
triage life-affecting cases - a missed immunization, a malnourished
child, a patient at risk of dropping TB treatment - from memory, with
no system to help them prioritize their limited time or reduce their
reporting workload. There is currently no tool that takes a worker's
own natural field observations and turns them into both an
automatically completed report and a prioritized, risk-ranked action
plan.

Every feature built MUST trace back to solving one of these two
failures:
(a) manual reporting burden
(b) absence of prioritization / decision support

If a proposed feature does not reduce (a) or improve (b), it is out
of scope.

====================================================================
IMPORTANT PROJECT STRUCTURE UPDATE
====================================================================

THE PROJECT ROOT MUST CONTAIN:

- client/
- server/

DO NOT CREATE:
- frontend/
- backend/

USE THIS STRUCTURE ONLY.

====================================================================
CORE CONSTRAINTS
====================================================================

- Frontend inside client/ only
- Backend inside server/ only
- JavaScript only (no TypeScript)
- MERN stack
- Agentic AI workflow architecture
- free / local AI only
- no paid APIs required
- must work even if Ollama is unavailable
- must work even if MongoDB is unavailable
- must not rely on cloud vector DB
- must not rely on paid speech-to-text service
- must not use fake placeholder implementations
- AI must NEVER output a diagnosis, treatment plan, or medication
  recommendation - only observations, risk flags, and follow-up
  urgency (see AI SAFETY GUARDRAIL section)

LOCAL / FREE AI RULE
--------------------
Use only local / free tools:
- Ollama
- chat model: llama3.1:8b
- embedding model: nomic-embed-text
- for voice notes: browser-native Web Speech API (free, offline-
  capable on-device) for transcription as the default path; the
  transcript text is then sent through the same Ollama pipeline as
  a typed note. Do NOT depend on any paid cloud speech API.

OFFLINE / FALLBACK RULE
-----------------------
- If Ollama is down, workflows must still work with deterministic
  fallback logic (keyword/rule-based extraction and risk scoring).
- If MongoDB is not configured, the app must run using an in-memory
  repository.
- If the Web Speech API / microphone is unavailable, the worker must
  be able to type the note instead - voice is a convenience path,
  never a hard dependency.

====================================================================
FINAL TECH STACK
====================================================================

FRONTEND
---------
- React 18
- Vite
- TailwindCSS
- React Router
- TanStack React Query
- Zustand
- react-hook-form
- axios
- lucide-react
- react-to-print (for formal report export/printing)

BACKEND
--------
- Node.js
- Express
- MongoDB + Mongoose
- multer (for any file/audio blob upload)
- bcryptjs
- jsonwebtoken
- dotenv
- node-cron (for optional scheduled escalation digest)

OPTIONAL QUEUE SUPPORT (only if configured)
-------------------------------------------
- BullMQ
- ioredis

AI STACK
---------
- Local Ollama inference
- chat model: llama3.1:8b
- embedding model: nomic-embed-text
- embeddings stored inside Visit.embedding (no separate vector DB) -
  used only for optional "similar past cases" retrieval, not required
  for MVP correctness

====================================================================
RUNNING PORTS / RUNTIME DEFAULTS
====================================================================

Frontend (Vite): localhost:5173
Backend (Express): localhost:3001
MongoDB (optional): localhost:27017
Ollama (optional): localhost:11434

API base in client: VITE_API_BASE_URL or http://localhost:3001/api

====================================================================
FINAL PROJECT STRUCTURE
====================================================================

sahayak-ai/
|
+-- client/
|   +-- src/
|       +-- api/
|       +-- components/
|       +-- pages/
|       +-- store/
|       +-- utils/
|       +-- main.jsx
|       +-- router.jsx
|       +-- index.css
|
+-- server/
|   +-- src/
|   |   +-- config/
|   |   +-- models/
|   |   +-- services/
|   |   +-- agents/
|   |   +-- controllers/
|   |   +-- routes/
|   |   +-- middleware/
|   |   +-- utils/
|   |   +-- jobs/
|   |   +-- data/
|   |   +-- app.js
|   |   +-- server.js
|   +-- scripts/
|   +-- uploads/
|   +-- logs/
|
+-- .env
+-- README.md
+-- DEMO_SCRIPT.md

====================================================================
MANDATORY IMPLEMENTATION RULES
====================================================================

CLIENT FOLDER
--------------
The ENTIRE frontend MUST be implemented ONLY inside /client.
This includes pages, routes, UI components, worker dashboard,
supervisor dashboard, visit-recording flow, report view, Zustand
store, Tailwind setup, axios API calls, forms, auth UI.

SERVER FOLDER
--------------
The ENTIRE backend MUST be implemented ONLY inside /server.
This includes Express server, APIs, agents, pipeline, MongoDB
integration, Mongoose models, auth, fallback logic, logging.

STRICT RULES
------------
1. NEVER create additional frontend/backend root folders.
2. ALWAYS use /client and /server.
3. ALL frontend code MUST remain inside /client.
4. ALL backend code MUST remain inside /server.
5. Any uploaded audio blobs MUST be stored inside /server/uploads.
6. Mongoose models MUST exist inside /server/src/models.
7. All data access MUST go through the shared repository abstraction.
8. AI outputs MUST NEVER include a diagnosis, prescription, or
   treatment instruction under any circumstance - enforce this in the
   Task-stage prompt AND validate it in a post-processing check.

====================================================================
HOW THE SYSTEM WORKS
====================================================================

USER FLOW (WORKER)
-------------------
1. Worker registers / logs in
2. Worker selects or adds a household
3. Worker records a voice note (or types a note) describing the visit
4. System transcribes (if voice) -> extracts structured data ->
   scores risk -> generates report
5. Worker reviews the extracted summary (editable before saving)
6. Worker sees her dashboard: all households sorted by risk/urgency
7. High-risk cases are automatically flagged for supervisor review

USER FLOW (SUPERVISOR)
-----------------------
1. Supervisor logs in
2. Supervisor sees a consolidated table of all Critical/High cases
   across every worker they oversee
3. Supervisor marks cases as reviewed/resolved

AI FLOW
-------
Voice Note / Typed Note
      |
Transcription (Web Speech API, if voice)
      |
Extraction (transcript -> structured JSON: household, category,
observations, risk indicators, follow_up_needed)
      |
Risk Scoring (structured data -> risk_level + one-line justification)
      |
Report Generation (structured data -> formal report document)
      |
Escalation Check (if risk_level in [high, critical] -> create
Escalation record visible to supervisor)
      |
Visit saved (extracted_data + risk_level + justification + report +
trace)

====================================================================
AI SAFETY GUARDRAIL (NON-NEGOTIABLE)
====================================================================

This system assists PRIORITIZATION and REPORTING ONLY.

The AI MUST NOT:
- diagnose a condition
- recommend a medication, dosage, or treatment
- tell the worker or patient what medical action to take

The AI MUST ONLY:
- restate observations reported by the worker
- flag risk indicators explicitly present in the transcript
- assign a risk/urgency level for triage/prioritization purposes
- recommend "follow-up needed: yes/no" and a follow-up timeframe
  (e.g., "within 48 hours"), never a clinical action

Every screen displaying AI output MUST show this fixed disclaimer:
"This tool assists prioritization and reporting. It does not
diagnose or replace clinical judgment."

The Task-stage prompt (see AI AGENT SYSTEM) MUST include this
constraint explicitly, and the Writer stage MUST reject/strip any
output that includes diagnostic or prescriptive language before it
is saved or displayed.

====================================================================
DATA MODELS
====================================================================

users: id, name, email, password, role [worker|supervisor],
       supervisorId (nullable, ref User), languagePref, createdAt

households: id, name, village, category
            [maternal|child_nutrition|TB_HIV|immunization|general],
            workerId (ref User), createdAt

visits: id, householdId (ref Household), workerId (ref User),
        timestamp, inputMode [voice|typed], rawTranscript (text),
        extractedData (JSON: observations[], riskIndicators[],
        followUpNeeded, followUpReason),
        riskLevel [low|medium|high|critical],
        riskJustification (text, one sentence),
        report (JSON: formal structured report fields),
        embedding (array, optional),
        status [pending_review|reviewed|escalated],
        trace (array of pipeline stage logs)

escalations: id, visitId (ref Visit), supervisorId (ref User),
             createdAt, resolved (bool), resolvedAt

====================================================================
STORAGE ARCHITECTURE
====================================================================

Use ONE repository interface for all data access.

Repository modes:
- Mongo mode: used when MONGODB_URI exists and connects
- Memory mode: used when MONGODB_URI is missing or Mongo connection
  fails

Repository operations (generic async):
getAll(collection, filter, sort)
getById(collection, id)
getOne(collection, filter)
create(collection, data)
updateById(collection, id, updates)
upsert(collection, filter, createData, updateData)
deleteById(collection, id)
deleteWhere(collection, filter)
count(collection, filter)

All controllers/services MUST use this repository layer.

====================================================================
AI AGENT SYSTEM (5 STAGES)
====================================================================

EXTRACTOR  - transcript -> structured JSON (household, category,
             observations, risk indicators, follow_up_needed);
             fabricates nothing not stated or strongly implied

RISK SCORER - structured JSON -> risk_level [low|medium|high|
              critical] + one-sentence justification, using fixed
              triage rules (see RISK RUBRIC below)

REPORT WRITER - structured JSON + risk output -> formal report object
                matching government-report field conventions (see
                REPORT FORMAT)

ESCALATION EVALUATOR - if risk_level in [high, critical], create an
                       Escalation record and attach to supervisor
                       queue

TRACE LOGGER - records each stage's input/output/timestamp into
               visit.trace for auditability (judge-visible
               "explainability" feature)

All stages call Ollama and MUST return safe deterministic fallback
values on failure (see FALLBACK LOGIC).

RISK RUBRIC (fixed reference used inside the Risk Scorer prompt)
------------------------------------------------------------------
Critical: immediate safety risk (e.g. severe malnutrition signs, TB
treatment abandonment, obstetric danger signs)
High: clear risk indicator requiring follow-up within days (e.g.
missed immunization, persistent fever, second consecutive flagged
visit)
Medium: worth monitoring, not urgent (e.g. mild symptom, first-time
minor concern)
Low: routine, no follow-up needed

====================================================================
WORKFLOW ENGINE
====================================================================

Every visit runs through the same pipeline:

Extractor -> Risk Scorer -> Report Writer -> Escalation Evaluator ->
Trace Logger -> Save Visit

Each run stores: rawTranscript, extractedData, riskLevel,
riskJustification, report, trace, status.
Pipeline: create visit (pending_review) -> run stages -> save report
-> save trace -> mark reviewed or escalated.

====================================================================
REQUIRED WORKFLOWS (5)
====================================================================

1. RECORD VISIT
   input: householdId, transcript (from voice or typed)
   output: { "extractedData": {...}, "riskLevel": "...",
             "riskJustification": "...", "report": {...} }
   extra: runs full pipeline; creates Escalation if High/Critical

2. WORKER DASHBOARD (PRIORITIZED LIST)
   input: workerId
   output: households sorted by most recent visit riskLevel
           (critical -> high -> medium -> low), each with justification

3. HOUSEHOLD REPORT VIEW
   input: visitId
   output: formal report object, printable/exportable

4. SUPERVISOR ESCALATION DASHBOARD
   input: supervisorId
   output: all unresolved Escalations across all workers under this
           supervisor, with household, worker, riskLevel,
           justification, timestamp

5. SIMILAR PAST CASES (OPTIONAL / GOOD-TO-HAVE)
   input: visitId
   output: top 3 semantically similar past visits for the same
           household (via embedding similarity), to show risk
           trend/history

====================================================================
FALLBACK LOGIC WHEN OLLAMA IS UNAVAILABLE
====================================================================

- Extractor: rule-based keyword extraction (symptom keyword list,
  "missed"/"not gained weight"/"fever" pattern matching) -> structured
  JSON with lower-confidence flag
- Risk Scorer: deterministic rubric applied to matched keywords
  (e.g., presence of "missed immunization" -> High by rule)
- Report Writer: template-filled report using extracted fields
  directly, no free-text generation
- Escalation Evaluator: rule-based, unaffected by Ollama availability
  (pure logic on riskLevel)

The app MUST NOT stop functioning just because Ollama is down. Every
AI-derived field MUST carry a "source: ai | fallback" tag so the UI
can (optionally) indicate when fallback logic was used.

====================================================================
VISIT INGESTION (VOICE / TYPED NOTE)
====================================================================

Supported input modes: voice (Web Speech API transcription, on-
device, free), typed (plain textarea)

Ingestion flow:
capture transcript -> create Visit (pending_review) -> run pipeline
(Extractor -> Risk Scorer -> Report Writer -> Escalation Evaluator ->
Trace Logger) -> present editable summary to worker for confirmation
-> save final Visit as reviewed

If transcription fails or produces near-empty text, prompt the
worker to type the note instead - never block the workflow.

====================================================================
API ENDPOINTS
====================================================================

HEALTH
GET /api/health

AUTH
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

HOUSEHOLDS
GET    /api/households?workerId=
POST   /api/households
GET    /api/households/:id
PATCH  /api/households/:id
DELETE /api/households/:id

VISITS
POST   /api/visits                    (runs full AI pipeline)
GET    /api/visits?workerId=          (sorted by riskLevel desc)
GET    /api/visits/:id
PATCH  /api/visits/:id                (status update / edit before save)
GET    /api/visits/:id/similar        (optional embedding search)

REPORTS
GET /api/visits/:id/report            (formal report object)

SUPERVISOR
GET   /api/supervisor/escalations?supervisorId=
PATCH /api/escalations/:id            ({ resolved: true })

DASHBOARD
GET /api/dashboard?workerId=          (worker summary stats)
GET /api/dashboard/supervisor?supervisorId=

====================================================================
WORKFLOW GRAPH (JUDGE-FACING EXPLAINABILITY VIEW)
====================================================================

Show 5 stages: Extractor, Risk Scorer, Report Writer, Escalation
Evaluator, Trace Logger.

Activation rules:
- Extractor active if at least one visit has been recorded
- Risk Scorer active if at least one visit has extractedData
- Report Writer active if at least one visit has a report object
- Escalation Evaluator active if at least one Escalation exists
- Trace Logger active if at least one visit has a non-empty trace

Do NOT light up all nodes for a fresh/empty account.

====================================================================
FRONTEND PAGES
====================================================================

PUBLIC
/login
/register

PROTECTED - WORKER
/                              (worker dashboard - prioritized list)
/households                    (household list / add household)
/households/:id                (household detail + visit history)
/visits/new                    (record visit - voice/typed)
/visits/:id                    (visit detail + report view)

PROTECTED - SUPERVISOR
/supervisor                    (escalation dashboard)
/supervisor/workers/:workerId  (single worker's household list, read-only)

SHARED
/pipeline                      (workflow graph / explainability view)

WORKER DASHBOARD PAGE MUST CONTAIN
- header with worker name, role, today's date
- summary stats (total households, critical count, high count, visits
  this week)
- prioritized household list, color-coded by risk (critical/high/
  medium/low), each row shows household name, village, risk level,
  one-line justification, last visit date
- "Record New Visit" primary action, clearly the most prominent
  element on the page
- fixed AI safety disclaimer visible on every AI-output screen

====================================================================
API CLIENT + STATE
====================================================================

- one axios instance: base URL from env, bearer token injection,
  logout on 401
- Zustand auth store: token, user, role; actions setSession, logout
  (persisted)
- React Query shared keys: auth user, dashboard, households,
  household detail, visits, visit detail, supervisor escalations
- invalidate queries after create/update/record-visit/resolve actions

====================================================================
SECURITY REQUIREMENTS
====================================================================

- JWT auth, bearer token verification
- bcryptjs password hashing
- email unique, password min length 6, invalid login returns 401
- multer file validation for any audio upload (type + 10MB limit)
- every resource user-scoped: a worker can only see her own
  households/visits; a supervisor can only see workers assigned to
  her (supervisorId match)
- errors returned as { "message": "..." }

====================================================================
ERROR HANDLING RULES
====================================================================

- centralized error middleware
- async route wrapper
- httpError(status, message) helper
- handle: invalid login, invalid token, unsupported input mode,
  transcription failure (fallback to typed input), missing
  household/visit, unauthorized access, failed AI pipeline stage
  (fallback logic engages, never a hard crash)

====================================================================
SEED / DEMO MODE
====================================================================

Demo worker account:
email: rani.worker@sahayak.ai
password: Password@123

Demo supervisor account:
email: sharma.supervisor@sahayak.ai
password: Password@123

Seed data MUST include:
- 1 worker, 1 supervisor (linked via supervisorId)
- 8-10 households with realistic Indian names/villages
- 8-10 visits already processed through the pipeline, spread across
  all 4 risk levels, so the dashboard is populated on first login
- at least 2 Critical-level visits with clear, compelling
  justifications, already escalated to the supervisor queue
- a pre-scripted demo transcript (also placed in DEMO_SCRIPT.md) that
  reliably produces a Critical result when read aloud live:
  "Meena's baby, second visit, still not gaining weight, mother says
  the last immunization appointment was missed."

- memory mode: seed demo user + demo data automatically on startup
- mongo mode: seed demo data if SEED_SAMPLE_DATA=true

====================================================================
ENV CONFIG
====================================================================

PORT
CLIENT_URL
MONGODB_URI
JWT_SECRET
JWT_EXPIRES_IN
OLLAMA_BASE_URL
OLLAMA_CHAT_MODEL
OLLAMA_EMBED_MODEL
UPSTASH_REDIS_URL
SEED_SAMPLE_DATA

If Mongo connection fails, fall back to memory mode instead of
crashing.

====================================================================
FORMAL UI / DESIGN REQUIREMENTS
====================================================================

This product is used by a government-adjacent frontline worker and
reviewed by a supervising health official. The UI MUST read as
serious, institutional, and trustworthy - NOT playful, NOT
consumer-app styled, NOT gamified.

VISUAL LANGUAGE
- Palette: deep navy / slate blue primary, white background, muted
  teal as secondary accent. Risk levels use a restrained, clinical
  color code only: Critical = deep red, High = amber/orange,
  Medium = muted yellow, Low = muted green. No neon, no gradients,
  no playful illustration style.
- Typography: clean, highly legible sans-serif (e.g., Inter or
  system-ui stack), generous font size for field-usability (workers
  may be reading this in bright outdoor light on a budget phone).
  Avoid decorative or script fonts entirely.
- Layout: structured, grid-aligned, government-form-like where
  reports are shown (label-left, value-right pattern for report
  fields, similar to an official form). Avoid card-heavy "consumer
  dashboard" styling in the report view specifically - the report
  view should look like a printable official document. The dashboard
  and workflow views may use clean cards, but still restrained and
  minimal, not decorative.
- Iconography: minimal, functional only (lucide-react outline icons),
  never decorative or cartoonish.
- No dark mode required; prioritize daylight/outdoor legibility.
- Report view MUST be print/export-ready with a formal header
  (organization name placeholder, worker name, date, household ID)
  resembling an official government health report layout.
- Every AI-output screen displays the fixed safety disclaimer in a
  clearly bordered, non-dismissible notice - styled like an official
  notice box, not a toast/snackbar.
- Mobile-first responsive: large tap targets, minimal text density
  per screen, since the primary worker-facing views will often be
  used on a budget Android phone in the field.

====================================================================
IMPLEMENTATION RULES FOR THE AGENT
====================================================================

1. USE JavaScript ONLY. DO NOT use TypeScript anywhere.
2. USE Express backend ONLY.
3. USE MongoDB + Mongoose, with in-memory fallback.
4. NEVER create NestJS structure or Prisma schema.
5. USE modular Express architecture.
6. ALL frontend code MUST remain inside /client.
7. ALL backend code MUST remain inside /server.
8. ALL data access MUST go through the repository abstraction.
9. Embeddings stored in Visit.embedding; NO separate vector DB.
10. Background queues/cron are OPTIONAL; core must work without them.
11. Keep workflow outputs structured to the defined JSON shapes.
12. Do not block the whole app if one visit's pipeline stage fails -
    fallback logic engages for that stage only.
13. Keep controllers thin; logic lives in services and agents.
14. App MUST work without Ollama (deterministic fallback).
15. App MUST work without MongoDB (memory mode).
16. Every protected resource MUST be user-scoped (worker sees own
    data; supervisor sees only her assigned workers' data).
17. Recording a visit MUST automatically trigger the full pipeline.
18. ALL agent outputs MUST be JSON serializable.
19. ALL visits MUST be trackable (status + trace).
20. AI output MUST NEVER contain diagnostic or prescriptive language
    - validate this in the Report Writer stage before saving.
21. Follow the FORMAL UI / DESIGN REQUIREMENTS section exactly - do
    not default to a generic playful SaaS dashboard template.

====================================================================
SUCCESS CRITERIA / ACCEPTANCE
====================================================================

PROJECT IS SUCCESSFUL IF:
- worker/supervisor can register, login, stay authenticated
- worker can create/list/update/delete households
- worker can record a visit via voice or typed note
- recorded visits are processed into extractedData, riskLevel,
  justification, and a formal report
- visit report is printable/exportable and formally styled
- worker dashboard correctly sorts households by risk level
- high/critical visits automatically create an Escalation visible to
  the correct supervisor only
- supervisor dashboard shows all escalations across her workers, and
  can mark them resolved
- workflow graph reflects actual pipeline activity per account
- app still works when Ollama is unavailable (fallback engages)
- app still works when MongoDB is unavailable (memory mode)
- no AI output anywhere in the app contains diagnostic or
  prescriptive language
- demo accounts and seed data work out of the box with zero setup

====================================================================
FINAL END-TO-END FLOW
====================================================================

Register / Login (worker or supervisor)
      |
[Worker] Add Household
      |
[Worker] Record Visit (voice or typed)
      |
Extractor -> Risk Scorer -> Report Writer -> Escalation Evaluator ->
Trace Logger
      |
Visit saved (extractedData + riskLevel + report + trace)
      |
[If High/Critical] Escalation created for supervisor
      |
Worker Dashboard updates (prioritized list)
      |
[Supervisor] views Escalation Dashboard, resolves case
      |
Report exportable/printable at any time from Visit detail

====================================================================
END OF FINAL IMPLEMENTATION SPEC
====================================================================
